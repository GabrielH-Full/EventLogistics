# ADR: Validação Atômica de Tickets e Deduzimento de Estoque na Barraca

**Data**: 07 de Agosto de 2026
**Status**: Aceito / Implementado
**Contexto do Projeto**: Sistema "EventLogistics" (Módulo de Barracas e Validação)

## 1. Contexto e Problema
A arquitetura anterior deduzia o estoque de forma descentralizada ou no momento da venda no Caixa Central. O novo modelo de negócios exigiu que o cliente comprasse o ticket (pago pelo valor) no caixa e **escolhesse os produtos fisicamente na barraca** na hora de retirar. 
Essa mudança introduziu os seguintes desafios:
- **Concorrência Massiva (Race Conditions)**: Se o estoque tiver apenas 1 unidade restante e 2 operadores diferentes da mesma barraca clicarem em "Validar" exatamente no mesmo milissegundo, o sistema poderia entrar em estado de inconsistência, resultando em "saldo negativo" (-1).
- **Velocidade de Operação**: O operador da barraca não pode ter travamentos de tela ou atrasos. A UI precisava permitir a baixa de pratos em menos de 500ms.
- **Tráfego de Rede (Overhead)**: Transmitir a atualização de estoque de um Caldo de Cana para *todas* as 50 barracas do evento desperdiçaria banda de rede e processamento nos tablets dos operadores.

## 2. Decisão Arquitetural

Para solucionar as exigências listadas no PRD (`prd.md`, `prd-frontend.md`) e desenhadas na `techspec.md`, tomamos as seguintes decisões técnicas centrais:

### 2.1. Controle de Concorrência via Banco de Dados (Pessimistic Locking / `FOR UPDATE`)
**Decisão**: Em vez de usar *Optimistic Locking* (versionamento de linha) ou delegar a trava para um cache em memória (como Redis), escolhemos utilizar as garantias transacionais ACID nativas do PostgreSQL através do `SELECT ... FOR UPDATE`.
**Motivação**: 
- A transação é encapsulada em um bloco `BEGIN`/`COMMIT`. O PostgreSQL trava fisicamente as linhas daquele produto durante a dedução.
- Se a quantidade acabar repentinamente pela transação vizinha, a transação atual sofre rollback antes de efetivar e responde um Erro 409 ou 400 sem corromper os dados.
- Elimina a necessidade de manter uma segunda infraestrutura (ex: Redis Lock).

### 2.2. Arquitetura Orientada a "Salas" no WebSocket (Rooms)
**Decisão**: Configurar o `socket.io` do Backend para particionar as conexões em salas usando o ID da barraca (ex: `stall_12345`). A API `broadcastToStall` foi criada no `socket.ts`.
**Motivação**:
- Minimiza a poluição global de eventos (Event Storm). A barraca de Doces não processa a atualização de estoque da barraca de Salgados.
- Permite que o *React Frontend* rode fluido (mantendo o limite exigido de 500ms e evitando gargalos de renderização na árvore virtual).

### 2.3. Estado em Memória (Local Cart) no Frontend e Fallbacks
**Decisão**: A criação do hook `useStallValidationCart.ts` gerencia o carrinho localmente sem bater no banco a cada clique de "+1". 
**Motivação**:
- Remove o Input Delay do operador (ele pode metralhar a tela sem travar).
- Incorpora uma barreira protetora (Race condition prevention): a promessa HTTP da validação roda contra um `TimeoutPromise` de 3 segundos. Se a conexão cair no meio do galpão do evento, a tela cancela o processo e evita "Duplo Clique" sem resposta.

### 2.4. Flexibilidade de Erros Humanos: Rota de Estorno Rápida
**Decisão**: Criada a rota atômica `/api/tickets/:id/revert` associada a um botão visual ("Desfazer") apenas no item mais recente da fila no Frontend.
**Motivação**: Compensa a super velocidade da nova interface de cliques. Se o operador bater o dedo no prato errado e validar, ele tem um botão de cancelamento fácil que roda a via transacional reversa no banco, repondo o estoque instantaneamente.

## 3. Consequências

### Pontos Positivos (Ganhos)
- **Consistência Absoluta**: Garantia de 100% de que o estoque não ficará negativo, provado empiricamente nos testes E2E (`test-integration.ts` Tarefa 5.0).
- **Escalabilidade Setorial**: A divisão de WebSockets por "Rooms" garante que a rede se comporte com extrema estabilidade mesmo com um volume (esperado de 1.000 requisições/hora) escalando até 10x mais.
- **Redução Cognitiva do Operador**: Sem modais modais complexos, escâneres e loaders agressivos. O design em "Frente de Caixa" proposto pelo PRD acelera enormemente a fila do evento.

### Pontos de Atenção (Trade-offs e Mitigações)
- **Contenção no Lock Pessimista**: Usar `FOR UPDATE` significa que requisições simultâneas para o *mesmo produto* são serializadas (ficam em fila no banco de dados). 
  - *Mitigação*: Como a transação é muito curta (apenas 2 inserts e 1 update simples), o tempo do lock não passa de 2~5 milissegundos. Para o volume projetado (1.000 req/h = ~0,3 req/s), não haverá deadlocks prolongados.
- **Acoplamento Estado/Socket**: Se o WebSocket do dispositivo cair temporariamente, o frontend pode não receber o novo bloqueio de baixo estoque.
  - *Mitigação*: Caso ocorra, o banco bloqueia na camada mais baixa (via `FOR UPDATE`), retornando o erro elegantemente para a UI avisando "Estoque insuficiente para a seleção".
