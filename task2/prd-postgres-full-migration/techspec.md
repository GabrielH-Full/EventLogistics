# Tech Spec — Migração Completa para PostgreSQL como Fonte Única da Verdade

**PRD de referência:** `task2/prd-postgres-full-migration/prd.md`
**Branch:** `refactor/postgres-full-migration`

---

## Resumo Executivo

A migração elimina o estado em memória (`state: AppState`) e o arquivo `data.json` do backend do EventLogistics, tornando o PostgreSQL a única fonte da verdade. A estratégia é de refatoração incremental por rota: cada arquivo de rotas que hoje importa `{ state, save }` de `../db` será reescrito para usar `db.query()` com transações explícitas. O `db.ts` será simplificado para exportar apenas o `Pool` do Postgres. Uma nova função utilitária `fetchPublicState()` substituirá `publicState()`, sendo assíncrona e consultando o banco diretamente. A tabela `audit_logs` é adicionada via migration `003_audit_logs.sql` e um helper `logAudit()` centraliza os inserts de auditoria como operação best-effort. O `broadcastState()` em `socket.ts` torna-se assíncrono e chama `fetchPublicState()` antes de emitir o evento WebSocket.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│  backend/src/                                                    │
│                                                                  │
│  db.ts          → Exporta apenas: db (pg.Pool)                  │
│                   + fetchPublicState(): Promise<PublicState>     │
│                                                                  │
│  socket.ts      → broadcastState() agora async                  │
│                   chama fetchPublicState() antes de emit         │
│                                                                  │
│  audit.ts (NEW) → logAudit(params): Promise<void>               │
│                   helper best-effort para audit_logs             │
│                                                                  │
│  routes/                                                         │
│    ticketRoutes.ts     → reescrito: db.query() + transação       │
│    productRoutes.ts    → reescrito: db.query() + transação       │
│    stateRoutes.ts      → reescrito: async, chama fetchPublicState│
│    adminProductRoutes.ts → remove syncStateProducts() + save()   │
│    adminStallRoutes.ts   → remove save() restante                │
│                                                                  │
│  migrations/                                                     │
│    003_audit_logs.sql  → cria tabela audit_logs + índices        │
└──────────────────────────────────────────────────────────────────┘
```

**Fluxo de dados pós-migração (venda de ticket):**

```
POST /api/tickets
  → requireAuth + requireRole('admin')
  → BEGIN TRANSACTION
  → SELECT stock FROM products WHERE product_id = $1 FOR UPDATE  ← lock
  → validação de estoque (em memória, com dados do SELECT)
  → INSERT INTO tickets + INSERT INTO ticket_items
  → UPDATE products SET stock = stock - $qty
  → COMMIT
  → logAudit({ action: 'TICKET_CREATED', ... })  ← fire-and-forget
  → broadcastState()                              ← async, busca do banco
  → res.json({ ticket })
```

---

## Design de Implementação

### Interfaces Principais

**`db.ts` — após refatoração**

```typescript
import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgres://eventlogistics:eventlogistics_secret@localhost:5433/eventlogistics_db'
});

export interface PublicState {
  products: Record<string, unknown>[];
  stalls:   Record<string, unknown>[];
  tickets:  Record<string, unknown>[];
}

export async function fetchPublicState(): Promise<PublicState> {
  const [products, stalls, tickets] = await Promise.all([
    db.query('SELECT * FROM products WHERE is_active = true ORDER BY name'),
    db.query('SELECT * FROM stalls   WHERE is_active = true ORDER BY name'),
    db.query('SELECT * FROM tickets  ORDER BY created_at DESC LIMIT 100'),
  ]);
  return {
    products: products.rows,
    stalls:   stalls.rows,
    tickets:  tickets.rows,
  };
}
```

**`audit.ts` (arquivo novo)**

```typescript
import { db } from './db';

interface AuditParams {
  userId:     number | null;
  action:     string;          // ex: 'TICKET_CREATED'
  entityType: string;          // ex: 'tickets'
  entityId:   string;
  before?:    Record<string, unknown> | null;
  after?:     Record<string, unknown> | null;
}

// Fire-and-forget: nunca lança exceção para o chamador
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.userId,
        params.action,
        params.entityType,
        params.entityId,
        JSON.stringify({ before: params.before ?? null, after: params.after ?? null }),
      ]
    );
  } catch (err) {
    console.error('[audit] Falha ao registrar audit_log:', err);
  }
}
```

**`socket.ts` — broadcastState assíncrono**

```typescript
import { fetchPublicState } from './db';

export async function broadcastState(): Promise<void> {
  if (!io) return;
  try {
    const state = await fetchPublicState();
    io.emit('state:update', state);
  } catch (err) {
    console.error('[broadcastState] Falha ao buscar estado do banco:', err);
    // silencia — clientes se recuperam via reconexão Socket.IO
  }
}
```

### Modelos de Dados

**Migration `003_audit_logs.sql` (nova)**

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT      REFERENCES users(user_id) ON DELETE SET NULL,
  action      VARCHAR(60) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   TEXT        NOT NULL,
  changes     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity  ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
```

**Convenção de `action` (SCREAMING_SNAKE_CASE):**

| action                | rota origem                              |
|-----------------------|------------------------------------------|
| `TICKET_CREATED`      | `POST /api/tickets`                      |
| `TICKET_VALIDATED`    | `POST /api/tickets/:id/validate`         |
| `PRODUCT_CREATED`     | `POST /api/products` (admin)             |
| `PRODUCT_UPDATED`     | `PUT /api/products/:id` (admin)          |
| `PRODUCT_DELETED`     | `DELETE /api/products/:id` (admin)       |
| `PRODUCT_STOCK_UPDATED` | `POST /api/products/:id/production`    |
| `STALL_CREATED`       | `POST /api/stalls` (admin)               |
| `STALL_UPDATED`       | `PUT /api/stalls/:id` (admin)            |
| `STALL_STOCK_RESET`   | `POST /api/stalls/:stallId/reset`        |
| `USER_CREATED`        | `POST /api/users` (admin)                |
| `USER_UPDATED`        | `PUT /api/users/:id` (admin)             |
| `USER_DELETED`        | `DELETE /api/users/:id` (admin)          |

### Endpoints de API

Nenhum contrato de API muda. Os endpoints existentes mantêm método, caminho e formato de resposta idênticos. A mudança é exclusivamente na camada de persistência interna.

**Único endpoint cuja implementação muda significativamente:**

- `GET /api/state` — passa de síncrono (lê `state` em memória) para assíncrono (`await fetchPublicState()`). A rota deve ser atualizada para handler `async`.

---

## Pontos de Integração

**PostgreSQL (`pg.Pool`)**
- Já em uso. Sem mudança de biblioteca ou configuração de conexão.
- Padrão de transação: `const client = await db.connect()` → `client.query('BEGIN')` → operações → `client.query('COMMIT')` → `client.release()` no `finally`.
- Timeout de conexão: herdado da config padrão do `pg`. Não requer ajuste.

**Socket.IO**
- `broadcastState()` passa a ser `async`. Os chamadores nas rotas não precisam fazer `await broadcastState()` — a emissão é fire-and-forget no nível das rotas (a rota já respondeu ao cliente com `res.json()` antes do broadcast terminar).

---

## Análise de Impacto

| Componente Afetado           | Tipo de Impacto       | Descrição & Nível de Risco                                                            | Ação Requerida                              |
|------------------------------|-----------------------|---------------------------------------------------------------------------------------|---------------------------------------------|
| `backend/src/db.ts`          | Reescrita completa    | Remove `load`, `persist`, `save`, `state`. Exporta apenas `db` + `fetchPublicState`. Risco médio. | Reescrever o arquivo                        |
| `backend/src/socket.ts`      | Mudança de assinatura | `broadcastState()` vira `async Promise<void>`. Baixo risco.                          | Atualizar assinatura e implementação        |
| `backend/src/routes/ticketRoutes.ts` | Reescrita completa | Remove dependência de `state`/`save`. Adiciona transações e `SELECT FOR UPDATE`. Alto risco (lógica crítica). | Reescrever + testar com concorrência        |
| `backend/src/routes/productRoutes.ts` | Reescrita completa | Remove `state`/`save`. Reabastecimento via `UPDATE products SET stock`. Médio risco. | Reescrever                                  |
| `backend/src/routes/stateRoutes.ts`   | Ajuste menor       | Handler vira `async`, chama `fetchPublicState()`. Baixo risco.                       | Atualizar handler                           |
| `backend/src/routes/adminProductRoutes.ts` | Ajuste       | Remove `syncStateProducts()` e `save()`. Lógica já usa `db.query()`. Baixo risco.   | Remover chamadas órfãs                      |
| `backend/src/routes/adminStallRoutes.ts`   | Ajuste       | Remove chamadas residuais a `save()`. Baixo risco.                                   | Remover chamadas órfãs                      |
| `backend/src/seedData.ts`    | Arquivo órfão         | Não mais referenciado. Pode ser mantido para testes locais ou removido.              | Opcional: remover imports                   |
| `backend/migrations/`        | Nova migration        | Adicionar `003_audit_logs.sql`. Sem risco (apenas cria tabela nova).                 | Criar e aplicar migration                   |
| `backend/data.json`          | Remoção               | Arquivo deixa de ser gerado. Já está no `.gitignore`. Baixo risco.                   | Nenhuma (já ignorado pelo Git)              |
| Frontend                     | Sem impacto           | Contratos de API e eventos WebSocket mantidos idênticos.                             | Nenhuma                                     |

---

## Abordagem de Testes

### Testes Unitários

**`ticketRoutes.ts` — Casos críticos:**
- Venda com estoque suficiente: retorna `201` e decrementa estoque no banco.
- Venda com estoque insuficiente: retorna `409` sem modificar banco.
- Venda concorrente do mesmo produto (2 requisições simultâneas): apenas 1 deve ter sucesso se o estoque permitir apenas 1.
- Validação de ticket por operador da barraca correta: retorna `200`.
- Validação de ticket por operador de barraca errada: retorna `403`.

**`productRoutes.ts` — Casos:**
- Reabastecimento não ultrapassa `max_stock`: `stock = MIN(max_stock, stock + amount)`.
- Reset de estoque da barraca: verifica que apenas produtos da barraca afetada são alterados.

**`audit.ts` — Casos:**
- Falha no insert de auditoria não lança exceção (verifica que `logAudit` silencia o erro).
- Insert bem-sucedido: valida campos `action`, `entity_type`, `entity_id`, `changes`.

### Testes de Integração

Usar o arquivo existente `backend/test-integration.ts` como base.

- **Fluxo completo de venda:** `POST /api/auth/login` → `POST /api/tickets` → verificar banco (`SELECT stock FROM products WHERE product_id = $1`) → verificar `audit_logs`.
- **Fluxo de validação:** `POST /api/tickets/:id/validate` → verificar `tickets.status = 'validated'` no banco.
- **`GET /api/state`:** verificar que retorna dados do banco (criar produto via SQL direto e verificar que aparece na resposta).
- **WebSocket:** conectar cliente Socket.IO → `POST /api/tickets` → verificar que evento `state:update` é recebido com `products` atualizados.

---

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **`003_audit_logs.sql` + aplicar migration** — sem risco, sem dependência. Tabela nova, não quebra nada.

2. **`backend/src/audit.ts` (novo)** — helper `logAudit()` isolado, testável unitariamente antes de integrar nas rotas.

3. **`backend/src/db.ts`** — reescrever: remover `load/persist/save/state`, adicionar `fetchPublicState()`. Testar que o servidor inicia sem erros.

4. **`backend/src/socket.ts`** — tornar `broadcastState()` assíncrono. Depende de `fetchPublicState()` estar pronto.

5. **`backend/src/routes/stateRoutes.ts`** — ajuste simples, valida que `GET /api/state` responde com dados do banco.

6. **`backend/src/routes/productRoutes.ts`** — reescrever produção e reset. Médio risco, sem lógica de ticket.

7. **`backend/src/routes/ticketRoutes.ts`** — reescrita mais complexa (transações + `SELECT FOR UPDATE`). Deixar por último das rotas core para ter os outros componentes estabilizados.

8. **`adminProductRoutes.ts` + `adminStallRoutes.ts`** — remover `syncStateProducts()` e `save()` residuais. Operação de limpeza simples.

9. **Testes de integração end-to-end** — validar todos os fluxos com banco real.

10. **Remover `seedData.ts`** — após confirmar que nada mais o importa.

### Dependências Técnicas

- **PostgreSQL rodando** via `docker-compose up` (já configurado).
- Migration `003_audit_logs.sql` deve ser aplicada antes de qualquer deploy.
- Não há dependências de bibliotecas externas novas — tudo usa `pg` e `socket.io` já instalados.

---

## Monitoramento e Observabilidade

**Logs estruturados (console):**
- `[broadcastState] Falha ao buscar estado do banco: <err>` — indica problema de conexão com o banco.
- `[audit] Falha ao registrar audit_log: <err>` — indica problema de escrita na tabela de auditoria.
- Erros de transação nas rotas: já capturados nos blocos `catch` existentes com `console.error`.

**Métricas de saúde:**
- `GET /api/health` existente retorna `{ ok: true }` — pode ser estendido futuramente para incluir status do banco (`db.query('SELECT 1')`).

**Observabilidade via `audit_logs`:**
- A tabela `audit_logs` funciona como log de auditoria consultável diretamente no banco.
- Query de exemplo para monitorar atividade: `SELECT action, count(*) FROM audit_logs WHERE created_at > now() - INTERVAL '1 hour' GROUP BY action`.

---

## Considerações Técnicas

### Decisões Principais

**1. Transações explícitas em `ticketRoutes.ts`**
Usar `db.connect()` → `client.query('BEGIN')` em vez de `db.query()` diretamente. Razão: o `db.query()` do Pool é sempre autocommit; transações multi-statement exigem um `PoolClient` dedicado com `BEGIN/COMMIT/ROLLBACK` explícito.

**2. `SELECT FOR UPDATE` no estoque**
O lock de linha é obrigatório na venda para evitar overselling em requisições concorrentes. Alternativa rejeitada: check optimista (`WHERE stock >= $qty`) — não garante atomicidade sem lock.

**3. `logAudit()` como fire-and-forget, fora da transação principal**
Chamado após o `COMMIT` da operação principal, não dentro da transação. Razão: falha na auditoria não deve reverter uma venda real. Trade-off aceito: em caso de crash entre o COMMIT e o `logAudit()`, o evento não é auditado (janela de segundos).

**4. `fetchPublicState()` sem paginação**
Retorna todos os produtos/barracas ativos e os últimos 100 tickets. Suficiente para o volume de um evento presencial. Se o volume crescer, adicionar paginação ou cursores é a evolução natural.

**5. Sem ORM**
O projeto já usa SQL puro via `pg`. Manter essa decisão. Alternativa rejeitada (Prisma/Drizzle): adicionaria complexidade de setup e migrações sem benefício para o escopo atual.

### Riscos Conhecidos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Bug na lógica de transação do `ticketRoutes` causa rollback em venda válida | Média | Alto | Testar unitariamente com mock de `PoolClient` e teste de integração com banco real |
| `fetchPublicState()` lenta degradando WebSocket | Baixa | Médio | Monitorar tempo da query; adicionar índices se necessário |
| Migration `003` falha em banco de produção | Baixa | Alto | Testar migration em ambiente local antes do deploy; migration é só `CREATE TABLE IF NOT EXISTS` (idempotente) |
| `broadcastState()` assíncrona chamada sem `await` nas rotas | Baixa | Baixo | É intencional — resposta ao cliente não espera o broadcast |

### Requisitos Especiais

- **Atomicidade na venda de tickets:** obrigatória via `SELECT FOR UPDATE` + transação. Requisito não negociável.
- **Idempotência da migration:** `CREATE TABLE IF NOT EXISTS` garante que rodar a migration duas vezes não causa erro.
- **Sem downtime:** a migration `003` apenas adiciona tabela, sem alterar tabelas existentes. Pode ser aplicada com o backend rodando.
