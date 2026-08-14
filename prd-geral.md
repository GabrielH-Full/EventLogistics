# PRD — Plataforma EventLogistics (Controle de Estoque e Tickets de Eventos)

## Visão Geral

O **EventLogistics** é uma plataforma web integrada de gestão de vendas, controle de estoque em tempo real e validação de tickets projetada para festivais, feiras e grandes eventos.

### Problema que Resolve
Em eventos com caixas centrais e barracas de alimentos/bebidas descentralizadas, ocorre frequentemente um descompasso operacional: o caixa central continua vendendo fichas/tickets de produtos que já se esgotaram na produção da barraca. Isso gera filas, insatisfação dos participantes, estornos manuais e gargalos no atendimento.

### Público-Alvo e Personas
- **Operador do Caixa Central (`admin`)**: Responsável pela venda rápida de tickets para os participantes, montando carrinhos com itens de diversas barracas. Também gerencia usuários, barracas e produtos via painel administrativo.
- **Operador da Barraca (`stall` / `operator`)**: Responsável por gerenciar a produção/estoque de seus produtos e validar a entrega dos tickets apresentados pelos participantes.
- **Gestor do Evento (`admin`)**: Acompanha o fluxo global de vendas e os níveis de estoque de todo o evento.

### Valor de Negócio
Garante sincronização bidirecional instantânea (tempo real via WebSocket), bloqueio preventivo automático de vendas sem estoque, validação de tickets com controle de permissões por perfil de acesso e rastreabilidade completa de todas as operações via logs de auditoria.

---

## Objetivos

### Objetivos de Negócio
- Zerar incidentes de venda de produtos indisponíveis no estoque das barracas.
- Reduzir o tempo de fila e de atendimento tanto nos caixas quanto nas barracas.
- Prover visibilidade consolidada e em tempo real sobre o faturamento total e o consumo de estoque durante o evento.
- Permitir gestão administrativa completa (usuários, barracas, produtos) via interface web, sem necessidade de acesso ao servidor.

### Indicadores de Sucesso (KPIs)
- **Taxa de Recusa Pós-Pagamento**: 0% de vendas canceladas por falta de estoque.
- **Tempo Médio de Validação**: Menos de 5 segundos para conferência e validação do ticket na barraca.
- **Sincronização de Estado**: Latência sub-segundo (< 200ms em rede local) na atualização dos painéis após cada venda ou reposição.
- **Disponibilidade da Conexão em Tempo Real**: 99.9% de uptime da sessão WebSocket durante a realização do evento.

---

## Histórias de Usuário

### Persona: Operador do Caixa Central (Perfil `admin`)
- **US-01 — Venda Multiprodutos**: Como operador do caixa central, quero adicionar produtos de diferentes barracas ao mesmo carrinho e emitir um único ticket para simplificar a compra do participante.
- **US-02 — Bloqueio de Venda sem Estoque**: Como operador do caixa central, quero ser impedido automaticamente pelo sistema ao tentar vender um produto cujo estoque atingiu zero ou é insuficiente, evitando vendas indevidas.
- **US-03 — Painel Consolidado de Evento**: Como gestor do evento, quero visualizar o status de estoque e faturamento de todas as barracas simultaneamente para coordenar a logística do evento.
- **US-07 — Gestão de Usuários**: Como administrador, quero criar, editar, ativar/desativar usuários (admins, operadores e barracas) via interface web, sem precisar editar arquivos no servidor.
- **US-08 — Gestão de Barracas**: Como administrador, quero criar, editar e desativar barracas, associando operadores a elas, diretamente na plataforma.
- **US-09 — Gestão de Produtos**: Como administrador, quero criar, editar e desativar produtos, vinculando-os a barracas e subcategorias, via interface web.

### Persona: Operador da Barraca (Perfis `stall` / `operator`)
- **US-04 — Gestão de Produção e Estoque**: Como operador da barraca, quero visualizar apenas os produtos da minha barraca e registrar aumentos de estoque (lotes de produção) para liberar novas vendas no caixa central.
- **US-05 — Fila de Tickets Pendentes**: Como operador da barraca, quero visualizar em tempo real os tickets emitidos que contêm itens da minha barraca para preparar os pedidos com antecedência.
- **US-06 — Validação na Entrega**: Como operador da barraca, quero marcar um ticket como validado/entregue no momento da retirada para evitar reutilização de ingressos.
- **US-10 — Estorno de Validação**: Como operador da barraca ou administrador, quero poder reverter a validação de um ticket (`reverted`) para corrigir erros operacionais, com estoque restaurado automaticamente.

---

## Funcionalidades Principais

### 1. Autenticação e Gestão de Acesso Segregado
- **RF-01.1**: O sistema deve permitir autenticação via usuário e senha, retornando um token de sessão JWT assinado.
- **RF-01.2**: O sistema deve diferenciar as permissões entre três papéis: `admin` (caixa central / gestor), `stall` (operador titular de barraca) e `operator` (operador auxiliar de barraca).
- **RF-01.3**: Contas dos tipos `stall` e `operator` possuem associação ao identificador único de sua(s) barraca(s) via tabela `stall_users` (N:M).
- **RF-01.4**: O endpoint de login deve aplicar rate limiting (máximo de 10 tentativas por IP em 15 minutos) para proteger contra ataques de força bruta.
- **RF-01.5**: O backend deve expor `GET /api/auth/me` para validação e restauração de sessão ao recarregar a página.

### 2. Caixa Central & Emissão de Tickets (`CustomerTicketView`)
- **RF-02.1**: A interface do caixa central deve permitir selecionar produtos por categoria e subcategoria (hierarquia `food`/`drink`) e montagem de carrinho flexível.
- **RF-02.2**: Na confirmação da venda, o backend deve validar de forma atômica (transação PostgreSQL com `FOR UPDATE`) se a quantidade solicitada de cada produto está disponível no estoque.
- **RF-02.3**: Em caso de estoque suficiente, o sistema deve debitar imediatamente as unidades do produto e gerar um ticket com código identificador único (ex: `#8492`), timestamp, lista de itens e status inicial `pending`.
- **RF-02.4**: Se o estoque for insuficiente, o backend deve recusar a transação (status HTTP `409 Conflict`) informando o produto sem estoque e a quantidade disponível.
- **RF-02.5**: Toda criação de ticket deve ser registrada na tabela de auditoria (`audit_logs`) com a ação `TICKET_CREATED`.

### 3. Gestão de Estoque e Produção da Barraca (`StallOperatorView`)
- **RF-03.1**: A tela de produção deve filtrar e exibir estritamente os produtos pertencentes à barraca autenticada.
- **RF-03.2**: Deve permitir que a barraca incremente o estoque de um produto indicando a quantidade produzida, respeitando o limite máximo estipulado (`maxStock`) via `LEAST(max_stock, stock + amount)`.
- **RF-03.3**: O sistema deve destacar visualmente produtos com estoque crítico (estoque ≤ 15 unidades) ou esgotado (estoque = 0).
- **RF-03.4**: Deve permitir o reset/zeragem do estoque da barraca (`stock = 0`) para reinicialização operacional. A ação deve ser registrada em `audit_logs` com a ação `STALL_STOCK_RESET`.

### 4. Validação de Tickets na Barraca (`SalesValidatorView`)
- **RF-04.1**: A tela de validação deve exibir a listagem em tempo real de tickets com status `pending` que contenham ao menos um item da barraca autenticada.
- **RF-04.2**: O atendente da barraca deve conseguir alterar o status do ticket para `validated` com um único clique. A ação é registrada em `audit_logs` com `TICKET_VALIDATED`.
- **RF-04.3**: O backend deve bloquear tentativas de validação por barracas que não possuam itens vinculados ao ticket solicitado (retornando status HTTP `403 Forbidden`).
- **RF-04.4**: Deve ser possível reverter um ticket `validated` para o status `reverted`, restaurando o estoque de todos os itens atomicamente. A ação é registrada com `TICKET_REVERTED`.

### 5. Painel Geral de Acompanhamento (`CentralDashboardView`)
- **RF-05.1**: A conta `admin` deve ter acesso a um painel consolidado exibindo os cards de todas as barracas ativas cadastradas no sistema.
- **RF-05.2**: O painel deve apresentar o progresso visual de ocupação do estoque por produto, total arrecadado e volume de tickets emitidos.

### 6. Sincronização em Tempo Real (WebSocket)
- **RF-06.1**: Qualquer alteração de estado (venda de ticket, reposição de estoque, validação de ticket, estorno) deve disparar uma notificação via WebSocket (`state:update`) para todos os clientes conectados.
- **RF-06.2**: Clientes recém-conectados devem receber imediatamente o snapshot atual do estado do sistema (`GET /api/state` ou evento inicial do socket).
- **RF-06.3**: Eventos de validação e estorno de estoque devem também emitir eventos direcionados à barraca (`INVENTORY_UPDATED`, `TICKET_VALIDATED`) via `broadcastToStall`.

### 7. Gestão Administrativa via Interface Web (Admin CRUD)
- **RF-07.1 — Usuários**: O admin deve poder criar, listar (com paginação e filtros por role/status/busca), editar e ativar/desativar usuários via `GET|POST|PUT|DELETE /api/users`. Senhas são criptografadas com `bcrypt` e nunca expostas.
- **RF-07.2 — Barracas**: O admin deve poder criar, listar (com filtros por tipo/status/busca), editar e ativar/desativar barracas via `GET|POST|PUT|DELETE /api/stalls`. A tabela `stall_users` (N:M) associa operadores a barracas.
- **RF-07.3 — Produtos**: O admin deve poder criar, listar (com filtros por barraca/categoria/status/busca), editar e ativar/desativar produtos via `GET|POST|PUT|DELETE /api/products`. Suporte a subcategorias hierárquicas (`category_id`).
- **RF-07.4 — Subcategorias**: O admin deve poder criar, listar e excluir subcategorias de produto via `GET|POST|DELETE /api/product-categories`, classificadas por `parent_type` (`food` | `drink`).
- **RF-07.5**: Todas as operações de CRUD administrativo devem ser registradas na tabela `audit_logs`.

### 8. Logs de Auditoria
- **RF-08.1**: O sistema deve manter um registro imutável de todas as ações relevantes (`TICKET_CREATED`, `TICKET_VALIDATED`, `TICKET_REVERTED`, `PRODUCT_STOCK_UPDATED`, `STALL_STOCK_RESET` e operações de CRUD admin) na tabela `audit_logs`.
- **RF-08.2**: Cada log deve conter: `user_id`, `action`, `entity_type`, `entity_id`, `changes` (JSONB com `before`/`after`), e `created_at`.
- **RF-08.3**: Falhas na gravação do log não devem interromper a operação principal (padrão *fire-and-forget*).

---

## Experiência do Usuário

### Personas e Suas Necessidades
- **Operador do Caixa**: Necessita de uma interface ágil, com botões amplos, navegação rápida entre categorias e feedback instantâneo sobre a aprovação ou recusa do ticket.
- **Atendente da Barraca**: Opera frequentemente em tablets ou monitores touch em ambiente agitado; necessita de botões de validação de alta visibilidade e alertas visuais chamativos para produtos esgotados.
- **Gestor do Evento**: Necessita de clareza visual e agrupamento lógico de dados para identificar gargalos de produção de relance.

### Fluxos e Interações Principais
1. **Fluxo de Venda**: Seleção de Itens → Verificação de Estoque no Carrinho → Clique em "Finalizar Ticket" → Confirmação Visual → Impressão/Exibição do Código do Ticket.
2. **Fluxo de Reabastecimento**: Seleção do Produto na Barraca → Clique em "+ Adicionar Produção" → Atualização Imediata do Indicador de Estoque → Liberação Automática no Caixa.
3. **Fluxo de Validação**: Identificação do Ticket Pendente → Conferência dos Itens → Clique em "Validar Ticket" → Atualização da Lista de Pendências.
4. **Fluxo de Estorno**: Localização do Ticket Validado → Clique em "Reverter" → Confirmação → Estoque restaurado automaticamente → Status `reverted`.

### Requisitos de UI/UX e Acessibilidade
- **Design System**: Interface com paleta de cores moderna (modo escuro com destaques vibrantes), tipografia limpa (Google Fonts / Inter / Roboto) e barras de progresso dinâmicas.
- **Identificação Visual**: Destaques coloridos em verde (estoque normal), amarelo/laranja (estoque baixo ≤ 15) e vermelho (esgotado).
- **Acessibilidade e Usabilidade**: Alvos de toque com tamanho mínimo de 48px para facilidade de uso em dispositivos móveis/tablets; contraste adequado para leitura em ambientes abertos de eventos.

---

## Restrições Técnicas de Alto Nível

### Stack Tecnológica
- **Frontend**: React / Vite / TypeScript
- **Backend**: Node.js / Express / TypeScript / Socket.IO
- **Banco de Dados**: PostgreSQL 16 (via Docker ou serviço gerenciado)
- **ORM/Driver**: `pg` (Pool de conexões) — sem ORM, SQL explícito
- **Containerização**: Docker Compose para orquestração local (PostgreSQL + volumes)

### Integrações e Arquitetura de Sistemas
- **Arquitetura Desacoplada**: Separação clara entre Frontend Web (React / Vite / TypeScript) e Backend API (Node.js / Express / TypeScript / Socket.IO).
- **Comunicação em Tempo Real**: Protocolo WebSocket via Socket.IO para propagação pub/sub das atualizações de estado global e eventos direcionados por barraca.
- **Schema Versionado**: Banco de dados gerenciado por migrações SQL numeradas (`001_init_schema.sql`, `002_admin_crud.sql`, `003_audit_logs.sql`, `004_ticket_validation_fields.sql`).

### Segurança e Conformidade
- **Fonte Única da Verdade**: O backend deve validar obrigatoriamente todas as regras de negócio e permissões, rejeitando dados inconsistentes do frontend.
- **Gestão de Sessão**: Uso de tokens de acesso JWT transmitidos via cabeçalho `Authorization: Bearer <token>`.
- **Proteção de Credenciais**: Senhas de usuários armazenadas exclusivamente com algoritmo de hash seguro (`bcrypt`).
- **Rate Limiting**: Login limitado a 10 tentativas por IP/15 minutos para proteger contra força bruta.
- **Headers de Segurança**: `helmet` habilitado em todas as respostas HTTP.
- **Tamanho de Payload**: Limite de 10kb por requisição JSON para mitigar ataques de payload massivo.

### Performance e Escalabilidade
- **Baixa Latência**: Tempo de resposta do backend para operações de venda e validação inferior a 150ms em rede local do evento (LAN/Wi-Fi).
- **Consistência de Estado**: Operações de estoque executadas com transações PostgreSQL explícitas (`BEGIN/COMMIT/ROLLBACK`) e bloqueio de linha (`FOR UPDATE`) para evitar condições de corrida (*race conditions*) entre múltiplos caixas simultâneos.
- **Pool de Conexões**: Pool PostgreSQL com até 20 conexões simultâneas, timeout de statement configurado em 10 segundos.

### Persistência e Dados
- **Banco de Dados Relacional**: PostgreSQL como fonte única de verdade, com suporte a transações ACID, índices em chaves estrangeiras e campos de status controlados por `CHECK` constraints.
- **Auditoria Permanente**: Todas as mutações relevantes persistidas na tabela `audit_logs` para rastreabilidade e resolução de disputas operacionais.

---

## Não-Objetivos (Fora de Escopo)

- **Modo 100% Offline sem Conectividade**: O sistema exige conexão de rede (Wi-Fi ou LAN local) ativa entre o frontend e o backend; não haverá fila offline local no navegador nesta versão.
- **Processamento de Pagamento Financeiro Direto**: A plataforma não processa pagamentos de cartão de crédito/PIX via gateway integrado (o pagamento financeiro é realizado externamente no caixa físico).
- **Validação Granular por Item dentro do Ticket**: A validação de um ticket é realizada em nível de ticket completo nesta versão.
- **Painel de Autoatendimento para Clientes (Self-Checkout em Smartphone)**: A emissão de tickets é restrita aos operadores de caixa central autorizados.
- **Suporte a Múltiplos Eventos Simultâneos**: A instância atual gerencia um único evento por vez. Multi-tenant (múltiplos eventos isolados) está fora do escopo desta versão.

---

## Questões em Aberto

1. **Validação Granular de Itens**: Como tratar cenários onde um ticket unificado com itens de múltiplas barracas precisa ter seus itens entregues em horários e barracas diferentes? (Sugestão para versão futura: implementar `status` por item `ticket.items[i].status`).
2. **Estratégia de Redundância e Fallback de Rede**: Qual deve ser o procedimento operacional padrão dos caixas caso a rede Wi-Fi local do evento oscile temporariamente?
3. **Exposição da API de Auditoria**: Deve haver uma tela ou endpoint para o admin consultar os `audit_logs` diretamente pela interface? Atualmente os logs só são acessíveis diretamente no banco.
4. **Migração para Múltiplos Eventos**: Em que ponto o schema deve ser estendido com uma entidade `events` para suportar múltiplos eventos isolados no mesmo banco de dados?