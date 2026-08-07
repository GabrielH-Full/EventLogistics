---
status: completed
parallelizable: false
blocked_by: ["3.0", "4.0", "2.0"]
---

<task_context>
<domain>backend/routes</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 7.0: Refatorar `ticketRoutes.ts` — Tickets com Transacoes

## Visao Geral

Reescrever completamente `backend/src/routes/ticketRoutes.ts` — a rota mais crítica do sistema. Toda a lógica de criação e validação de tickets, que hoje opera no estado em memória, passa a usar transações explícitas no PostgreSQL com `SELECT FOR UPDATE` para evitar overselling. Esta é a tarefa de maior complexidade e risco da migração.

## Requisitos

- Remover toda dependência de `state` e `save()`
- `POST /api/tickets`: usar transação com `SELECT stock FROM products WHERE product_id = $1 FOR UPDATE` para lock de linha
- Verificar estoque dentro da transação, após o lock
- Inserir em `tickets` e `ticket_items` dentro da mesma transação
- `UPDATE products SET stock = stock - $qty` dentro da transação
- `POST /api/tickets/:id/validate`: verificar ownership via JOIN `ticket_items → products` (sem state em memória)
- Registrar auditoria via `logAudit()` após cada operação
- Usar `PoolClient` (não `Pool.query`) para transações multi-statement

## Subtarefas

- [ ] 7.1 Remover imports de `state`, `save`, `Ticket`, `TicketItem` do domínio em memória
- [ ] 7.2 Importar `db` de `../db`, `logAudit` de `../audit`, `randomUUID` de `crypto`
- [ ] 7.3 Reescrever `POST /api/tickets`:
  - [ ] 7.3.1 Obter `PoolClient` com `const client = await db.connect()`
  - [ ] 7.3.2 `await client.query('BEGIN')`
  - [ ] 7.3.3 Para cada item: `SELECT stock, name, price, stall_id FROM products WHERE product_id = $1 FOR UPDATE`
  - [ ] 7.3.4 Validar estoque (dentro da transação, com os dados do SELECT)
  - [ ] 7.3.5 `INSERT INTO tickets (ticket_id, code, total, status) VALUES (...)`
  - [ ] 7.3.6 `INSERT INTO ticket_items (ticket_id, product_id, quantity, unit_price) VALUES (...)` para cada item
  - [ ] 7.3.7 `UPDATE products SET stock = stock - $qty WHERE product_id = $1` para cada item
  - [ ] 7.3.8 `await client.query('COMMIT')`
  - [ ] 7.3.9 Em caso de erro: `await client.query('ROLLBACK')`
  - [ ] 7.3.10 Sempre: `client.release()` no bloco `finally`
- [ ] 7.4 Reescrever `POST /api/tickets/:id/validate`:
  - [ ] 7.4.1 Buscar ticket: `SELECT * FROM tickets WHERE ticket_id = $1`
  - [ ] 7.4.2 Verificar ownership via JOIN: `SELECT COUNT(*) FROM ticket_items ti JOIN products p ON ti.product_id = p.product_id WHERE ti.ticket_id = $1 AND p.stall_id = $2`
  - [ ] 7.4.3 `UPDATE tickets SET status = 'validated' WHERE ticket_id = $1`
  - [ ] 7.4.4 Chamar `logAudit({ action: 'TICKET_VALIDATED', ... })`
- [ ] 7.5 Testar: venda normal com estoque disponível
- [ ] 7.6 Testar: venda com estoque insuficiente retorna 409 sem modificar banco
- [ ] 7.7 Testar: operador de barraca errada recebe 403 ao validar ticket

## Sequenciamento

- Bloqueado por: 3.0 (db.ts), 4.0 (socket.ts), 2.0 (audit.ts)
- Desbloqueia: 9.0
- Paralelizavel: Nao (lógica mais crítica, fazer por último entre as rotas)

## Detalhes de Implementacao

**Padrao de transacao com PoolClient:**
```typescript
const client = await db.connect();
try {
  await client.query('BEGIN');
  // ... operacoes da transacao ...
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

**SELECT FOR UPDATE — previne overselling:**
```sql
SELECT stock, name, price, stall_id
FROM products
WHERE product_id = $1
FOR UPDATE
```
Este lock garante que se duas requisicoes chegarem ao mesmo tempo, apenas uma consegue o lock. A segunda espera e, ao obter o lock, já verá o estoque decrementado pela primeira.

**Query de verificação de ownership do ticket (sem state em memória):**
```sql
SELECT COUNT(*) FROM ticket_items ti
JOIN products p ON ti.product_id = p.product_id
WHERE ti.ticket_id = $1
  AND p.stall_id = $2
```

**Gerar ticket_id e code:**
```typescript
import { randomUUID } from 'crypto';
const ticket_id = randomUUID();
const code = '#' + Math.floor(8000 + Math.random() * 999);
```

## Criterios de Sucesso

- `ticketRoutes.ts` não importa `state`, `save`, `Ticket`, `TicketItem`
- `POST /api/tickets` com estoque suficiente: retorna 201, decrementa estoque no banco, insere em `tickets` e `ticket_items`
- `POST /api/tickets` com estoque insuficiente: retorna 409, banco não é modificado (rollback confirmado)
- Duas vendas simultâneas do mesmo produto com estoque 1: apenas 1 tem sucesso (testar com Promise.all)
- `POST /api/tickets/:id/validate` por operador errado: retorna 403
- Registros aparecem em `audit_logs` após cada operação
- Arquivo compila sem erros TypeScript
