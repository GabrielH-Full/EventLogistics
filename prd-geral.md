# PRD — Plataforma EventLogistics (Controle de Estoque e Tickets de Eventos)

## Visão Geral

O **EventLogistics** é uma plataforma web integrada de gestão de vendas, controle de estoque em tempo real e validação de tickets projetada para festivais, feiras e grandes eventos.

### Problema que Resolve
Em eventos com caixas centrais e barracas de alimentos/bebidas descentralizadas, ocorre frequentemente um descompasso operacional: o caixa central continua vendendo fichas/tickets de produtos que já se esgotaram na produção da barraca. Isso gera filas, insatisfação dos participantes, estornos manuais e gargalos no atendimento.

### Público-Alvo e Personas
- **Operador do Caixa Central (`admin`)**: Responsável pela venda rápida de tickets para os participantes, montando carrinhos com itens de diversas barracas.
- **Operador da Barraca (`stall`)**: Responsável por gerenciar a produção/estoque de seus produtos e validar a entrega dos tickets apresentados pelos participantes.
- **Gestor do Evento (`admin`)**: Acompanha o fluxo global de vendas e os níveis de estoque de todo o evento.

### Valor de Negócio
Garante sincronização bidirecional instantânea (tempo real via WebSocket), bloqueio preventivo automático de vendas sem estoque e validação de tickets com controle de permissões por perfil de acesso.

---

## Objetivos

### Objetivos de Negócio
- Zerar incidentes de venda de produtos indisponíveis no estoque das barracas.
- Reduzir o tempo de fila e de atendimento tanto nos caixas quanto nas barracas.
- Prover visibilidade consolidada e em tempo real sobre o faturamento total e o consumo de estoque durante o evento.

### Indicadores de Sucesso (KPIs)
- **Taxa de Recusa Pós-Pagamento**: 0% de vendas canceladas por falta de estoque.
- **Tempo Médio de Validação**: Menos de 5 segundos para conferência e validação do ticket na barraca.
- **Sincronização de Estado**: Latência sub-segundo (< 200ms em rede local) na atualização dos painéis após cada venda ou reposição.
- **Disponibilidade da Conexão em Tempo Real**: 99.9% de uptime da sessão WebSocket durante a realização do evento.

---

## Histórias de Usuário

### Persona: Operador do Caixa Central (Perfil `admin`)
- **US-01 — Venda Multiprodtos**: Como operador do caixa central, quero adicionar produtos de diferentes barracas ao mesmo carrinho e emitir um único ticket para simplificar a compra do participante.
- **US-02 — Bloqueio de Venda sem Estoque**: Como operador do caixa central, quero ser impedido automaticamente pelo sistema ao tentar vender um produto cujo estoque atingiu zero ou é insuficiente, evitando vendas indevidas.
- **US-03 — Painel Consolidado de Evento**: Como gestor do evento, quero visualizar o status de estoque e faturamento de todas as barracas simultaneamente para coordenar a logística do evento.

### Persona: Operador da Barraca (Perfil `stall`)
- **US-04 — Gestão de Produção e Estoque**: Como operador da barraca, quero visualizar apenas os produtos da minha barraca e registrar aumentos de estoque (lotes de produção) para liberar novas vendas no caixa central.
- **US-05 — Fila de Tickets Pendentes**: Como operador da barraca, quero visualizar em tempo real os tickets emitidos que contêm itens da minha barraca para preparar os pedidos com antecedência.
- **US-06 — Validação na Entrega**: Como operador da barraca, quero marcar um ticket como validado/entregue no momento da retirada para evitar reutilização de ingressos.

---

## Funcionalidades Principais

### 1. Autenticação e Gestão de Acesso Segregado
- **RF-01.1**: O sistema deve permitir autenticação via usuário e senha, retornando um token de sessão JWT assinado.
- **RF-01.2**: O sistema deve diferenciar as permissões entre a conta Administradora (`admin`) e as contas de Barracas (`stall`).
- **RF-01.3**: Contas do tipo `stall` devem possuir uma associação direta a um identificador único de barraca (`stallId`).

### 2. Caixa Central & Emissão de Tickets (`CustomerTicketView`)
- **RF-02.1**: A interface do caixa central deve permitir selecionar produtos por categoria (Salgados, Doces, Bebidas) e montagem de carrinho flexível.
- **RF-02.2**: Na confirmação da venda, o backend deve validar de forma atômica se a quantidade solicitada de cada produto está disponível no estoque.
- **RF-02.3**: Em caso de estoque suficiente, o sistema deve debitar imediatamente as unidades do produto e gerar um ticket com código identificador único (ex: `#8492`), timestamp, lista de itens e status inicial `pending`.
- **RF-02.4**: Se o estoque for insuficiente, o backend deve recusar a transação (status HTTP `409 Conflict`) informando o produto sem estoque.

### 3. Gestão de Estoque e Produção da Barraca (`StallOperatorView`)
- **RF-03.1**: A tela de produção deve filtrar e exibir estritamente os produtos pertencentes à barraca autenticada.
- **RF-03.2**: Deve permitir que a barraca incremente o estoque de um produto indicando a quantidade produzida, respeitando o limite máximo estipulado (`maxStock`).
- **RF-03.3**: O sistema deve destacar visualmente produtos com estoque crítico (estoque ≤ 15 unidades) ou esgotado (estoque = 0).
- **RF-03.4**: Deve permitir o reset/restauração do estoque inicial da barraca para valores padrão em caso de reinicialização operacional.

### 4. Validação de Tickets na Barraca (`SalesValidatorView`)
- **RF-04.1**: A tela de validação deve exibir a listagem em tempo real de tickets com status `pending` que contenham ao menos um item da barraca autenticada.
- **RF-04.2**: O atendente da barraca deve conseguir alterar o status do ticket para `validated` com um único clique.
- **RF-04.3**: O backend deve bloquear tentativas de validação por barracas que não possuam itens vinculados ao ticket solicitado (retornando status HTTP `403 Forbidden`).

### 5. Painel Geral de Acompanhamento (`CentralDashboardView`)
- **RF-05.1**: A conta `admin` deve ter acesso a um painel consolidado exibindo os cards de todas as barracas cadastradas no sistema.
- **RF-05.2**: O painel deve apresentar o progresso visual de ocupação do estoque por produto, total arrecadado e volume de tickets emitidos.

### 6. Sincronização em Tempo Real (WebSocket)
- **RF-06.1**: Qualquer alteração de estado (venda de ticket, reposição de estoque, validação de ticket) deve disparar uma notificação via WebSocket (`state:update`) para todos os clientes conectados.
- **RF-06.2**: Clientes recém-conectados devem receber imediatamente o snapshot atual do estado do sistema (`GET /api/state` ou evento inicial do socket).

---

## Experiência do Usuário

### Personas e Suas Necessidades
- **Operador do Caixa**: Necessita de uma interface ágil, com botões amplos, navegação rápida entre categorias e feedback instantâneo sobre a aprovação ou recusa do ticket.
- **Atendente da Barraca**: Opera frequentemente em tablets ou monitores touch em ambiente agitado; necessita de botões de validação de alta visibilidade e alertas visuais chamativos para produtos esgotados.
- **Gestor do Evento**: Necessita de clareza visual e agrupamento lógico de dados para identificar gargalos de produção de relance.

### Fluxos e Interações Principais
1. **Fluxo de Venda**: Seleção de Itens -> Verificação de Estoque no Carrinho -> Clique em "Finalizar Ticket" -> Confirmação Visual -> Impressão/Exibição do Código do Ticket.
2. **Fluxo de Reabastecimento**: Seleção do Produto na Barraca -> Clique em "+ Adicionar Produção" -> Atualização Imediata do Indicador de Estoque -> Liberação Automática no Caixa.
3. **Fluxo de Validação**: Identificação do Ticket Pendente -> Conferência dos Itens -> Clique em "Validar Ticket" -> Atualização da Lista de Pendências.

### Requisitos de UI/UX e Acessibilidade
- **Design System**: Interface com paleta de cores moderna (modo escuro com destaques vibrantes), tipografia limpa (Google Fonts / Inter / Roboto) e barras de progresso dinâmicas.
- **Identificação Visual**: Destaques coloridos em verde (estoque normal), amarelo/laranja (estoque baixo ≤ 15) e vermelho (esgotado).
- **Acessibilidade e Usabilidade**: Alvos de toque com tamanho mínimo de 48px para facilidade de uso em dispositivos móveis/tablets; contraste adequado para leitura em ambientes abertos de eventos.

---

## Restrições Técnicas de Alto Nível

### Integrações e Arquitetura de Sistemas
- **Arquitetura Desacoplada**: Separação clara entre Frontend Web (React / Vite / TypeScript) e Backend API (Node.js / Express / Socket.IO).
- **Comunicação em Tempo Real**: Protocolo WebSocket via Socket.IO para propagação pub/sub das atualizações de estado.

### Segurança e Conformidade
- **Fonte Única da Verdade**: O backend deve validar obrigatoriamente todas as regras de negócio e permissões, rejeitando dados inconsistentes do frontend.
- **Gestão de Sessão**: Uso de tokens de acesso JWT transmitidos via cabeçalho `Authorization: Bearer <token>`.
- **Proteção de Credenciais**: Senhas de usuários armazenadas exclusivamente com algoritmo de hash seguro (`bcrypt`).

### Performance e Escalabilidade
- **Baixa Latência**: Tempo de resposta do backend para operações de venda e validação inferior a 150ms em rede local do evento (LAN/Wi-Fi).
- **Consistência de Estado**: Operações de estoque devem ser executadas com garantia de consistência (mutex / estado atômico em memória) para evitar condições de corrida (*race conditions*) entre múltiplos caixas simultâneos.

### Sensibilidade e Persistência de Dados
- **Persistência Local**: Armazenamento em arquivo de dados (`data.json`) com sincronização em disco a cada transação para resiliência a reinicializações.

---

## Não-Objetivos (Fora de Escopo)

- **Modo 100% Offline sem Conectividade**: O sistema exige conexão de rede (Wi-Fi ou LAN local) ativa entre o frontend e o backend; não haverá fila offline local no navegador nesta versão.
- **Processamento de Pagamento Financeiro Direto**: A plataforma não processa pagamentos de cartão de crédito/PIX via gateway integrado (o pagamento financeiro é realizado externamente no caixa físico).
- **Validação Parcial por Item dentro do Ticket**: A validação de um ticket é realizada em nível de ticket completo nesta versão (embora a permissão de validação dependa da presença de itens da barraca).
- **Painel de Autoatendimento para Clientes (Self-Checkout em Smartphone)**: A emissão de tickets é restrita aos operadores de caixa central autorizados.
- **Cadastro e Gestão Dinâmica de Usuários via Interface Web**: A adição/edição de novos usuários e barracas é realizada no arquivo de dados inicial (`seedData.js`), sem tela de CRUD dedicada no frontend nesta versão.

---

## Questões em Aberto

1. **Validação Granular de Itens**: Como tratar cenários onde um ticket unificado com itens de múltiplas barracas precisa ter seus itens entregues em horários e barracas diferentes? (Sugestão para versão futura: implementar status por item `ticket.items[i].status`).
2. **Estratégia de Redundância e Fallback de Rede**: Qual deve ser o procedimento operacional padrão dos caixas caso a rede Wi-Fi local do evento oscile temporariamente?
3. **Migração para Banco de Dados Relacional**: Em que ponto do crescimento do evento a persistência em `data.json` deve ser substituída por um SGBD relacional (como PostgreSQL/SQLite) com suporte a transações ACID explícitas?