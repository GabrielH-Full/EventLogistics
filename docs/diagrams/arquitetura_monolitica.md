# Arquitetura Monolítica — EventLogistics

## Visão Geral

O sistema é um **monólito modular** full-stack com frontend SPA separado. Todo o backend roda em um único processo Node.js (Express + Socket.IO), conectado a um único banco de dados PostgreSQL.

---

## Diagrama da Arquitetura

![Diagrama de Arquitetura](image-1.png)

---

## Camadas do Sistema

### 1. Frontend — React/Vite (SPA)

| Diretório | Responsabilidade |
|---|---|
| `src/pages/` | Páginas da aplicação |
| `src/components/` | Componentes reutilizáveis |
| `src/api/` | Chamadas HTTP ao backend |
| `src/hooks/` | Hooks customizados (ex: estado WebSocket) |
| `src/auth/` | Contexto de autenticação |
| `src/admin/` | Painel administrativo |
| `src/stall/` | Interface do atendente de barraca |

---

### 2. Backend — Express (Monólito)

#### Entry Point: `server.ts`

Inicializa o Express, aplica middlewares globais, registra todas as rotas e sobe o servidor HTTP + Socket.IO numa única instância.

#### Módulos Core

| Arquivo | Função |
|---|---|
| `auth.ts` | `signToken` / `verifyToken` via JWT + `checkPassword` via bcrypt |
| `db.ts` | Pool pg com 20 conexões, funções transacionais (`validateTicket`, `revertTicket`, `fetchPublicState`) |
| `middleware.ts` | `requireAuth` (JWT + Zero Trust DB check) e `requireRole` |
| `socket.ts` | Socket.IO: autenticação via JWT, salas por `stallId`, `broadcastState` após mutações |
| `audit.ts` | Fire-and-forget para tabela `audit_logs` |

#### Módulos de Rota

| Arquivo | Endpoints | Roles |
|---|---|---|
| `authRoutes.ts` | `POST /api/auth/login` | público |
| `stateRoutes.ts` | `GET /api/state` | autenticado |
| `ticketRoutes.ts` | CRUD de tickets | operator, admin |
| `userRoutes.ts` | CRUD de usuários | admin |
| `productRoutes.ts` | Produção e reset de barraca | stall, admin |
| `productCategoryRoutes.ts` | Categorias de produto | admin |
| `adminStallRoutes.ts` | CRUD de barracas | admin |
| `adminProductRoutes.ts` | CRUD de produtos | admin |

---

### 3. Banco de Dados — PostgreSQL 16

Rodando via Docker (`docker-compose.yml`) na porta `5433`. As migrations ficam em `backend/migrations/` e são executadas pelo init do container.

**Tabelas:**

| Tabela | Uso |
|---|---|
| `users` | Autenticação e controle de acesso |
| `stalls` | Barracas do evento |
| `products` | Produtos por barraca (com estoque) |
| `tickets` | Pedidos validados |
| `ticket_items` | Itens de cada pedido |
| `audit_logs` | Trilha de auditoria de ações |

---

## Padrões de Segurança

- **JWT + Zero Trust**: toda requisição autenticada verifica o token E consulta `is_active` no banco (fail-closed)
- **Rate Limiting**: login limitado a 10 req/15min por IP
- **Helmet**: headers de segurança HTTP
- **Transações com `FOR UPDATE`**: lock de linha no PostgreSQL para evitar race conditions no estoque
- **Fail-Closed**: se o banco falhar na verificação de auth, retorna `503` em vez de permitir acesso

---

## Fluxo Típico de Validação de Ticket

![Fluxo de Validação de Ticket](image-2.png)

---

## Características da Arquitetura Monolítica

| Aspecto | Detalhe |
|---|---|
| **Processo** | Single Node.js process com Express |
| **Deploy** | Backend único (`npm start` / `ts-node`) |
| **Comunicação interna** | Chamadas de função direta (sem rede entre módulos) |
| **Banco** | Único PostgreSQL compartilhado por todos os módulos |
| **Estado em tempo real** | Socket.IO no mesmo processo (sem Redis/adapter externo) |
| **Escalabilidade** | Vertical (por enquanto) — Socket.IO sem adapter externo implica single-instance |
