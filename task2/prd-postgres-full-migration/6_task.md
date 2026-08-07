---
status: completed
parallelizable: true
blocked_by: ["3.0", "2.0"]
---

<task_context>
<domain>backend/routes</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 6.0: Refatorar `productRoutes.ts` — Estoque via Banco

## Visao Geral

Reescrever `backend/src/routes/productRoutes.ts` para eliminar o uso de `state` e `save()`. As duas rotas do arquivo (`POST /api/products/:id/production` e `POST /api/stalls/:stallId/reset`) passam a operar diretamente no banco via `db.query()`. Também remover a dependência de `seedData.ts` (usada pelo reset de estoque).

## Requisitos

- Remover imports de `{ state, save }` e `{ buildInitialState }` de `../seedData`
- Reabastecimento (`/production`): usar `UPDATE products SET stock = LEAST(max_stock, stock + $amount)` com validação de ownership via JOIN
- Reset de estoque: `UPDATE products SET stock = 0` (ou valor de seed, se disponível no banco) para produtos da barraca
- Registrar auditoria via `logAudit()` após cada mutação
- Manter as verificações de ownership da barraca (operador só pode mexer em seus produtos)

## Subtarefas

- [ ] 6.1 Remover imports de `state`, `save`, `buildInitialState`, `Product`
- [ ] 6.2 Importar `db` de `../db` e `logAudit` de `../audit`
- [ ] 6.3 Reescrever `POST /api/products/:id/production`:
  - Buscar o produto via `SELECT * FROM products WHERE product_id = $1`
  - Verificar ownership (stall_id do produto vs stall_id do req.user)
  - `UPDATE products SET stock = LEAST(max_stock, stock + $amount) WHERE product_id = $1`
  - Chamar `logAudit({ action: 'PRODUCT_STOCK_UPDATED', ... })`
  - Chamar `broadcastState()` (fire-and-forget)
- [ ] 6.4 Reescrever `POST /api/stalls/:stallId/reset`:
  - Verificar ownership da barraca
  - `UPDATE products SET stock = 0 WHERE stall_id = $1` (reset para zero, ou valor inicial se houver coluna `initial_stock`)
  - Chamar `logAudit({ action: 'STALL_STOCK_RESET', ... })`
  - Chamar `broadcastState()` (fire-and-forget)
- [ ] 6.5 Testar: reabastecer produto e verificar que `stock` no banco foi atualizado
- [ ] 6.6 Testar: reset de estoque da barraca não afeta produtos de outra barraca

## Sequenciamento

- Bloqueado por: 3.0 (db.ts refatorado), 2.0 (audit.ts disponível)
- Desbloqueia: 9.0
- Paralelizavel: Sim (com 5.0 e 7.0, após 3.0 concluída)

## Detalhes de Implementacao

```typescript
// POST /api/products/:id/production — lógica pós-migração
router.post('/products/:id/production', requireAuth, requireRole('stall', 'operator'),
  async (req, res) => {
    const { id } = req.params;
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Quantidade de produção inválida.' });
    }

    const productRes = await db.query(
      'SELECT * FROM products WHERE product_id = $1', [id]
    );
    if (productRes.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });

    const product = productRes.rows[0];
    if ((req.user!.role === 'stall' || req.user!.role === 'operator')
        && product.stall_id !== req.user!.stallId) {
      return res.status(403).json({ error: 'Esse produto não pertence à sua barraca.' });
    }

    const before = { stock: product.stock };
    const updated = await db.query(
      'UPDATE products SET stock = LEAST(max_stock, stock + $1), updated_at = now() WHERE product_id = $2 RETURNING *',
      [amount, id]
    );
    const after = { stock: updated.rows[0].stock };

    logAudit({ userId: req.user!.sub, action: 'PRODUCT_STOCK_UPDATED',
               entityType: 'products', entityId: id, before, after });
    broadcastState();
    res.json({ product: updated.rows[0] });
  }
);
```

## Criterios de Sucesso

- `productRoutes.ts` não importa `state`, `save`, `buildInitialState`
- `POST /api/products/:id/production` atualiza estoque no banco com `LEAST(max_stock, stock + amount)`
- Operador de outra barraca recebe 403 ao tentar reabastecer produto que não é seu
- Registro aparece em `audit_logs` após cada operação
- `broadcastState()` é chamado e clientes WebSocket recebem `state:update`
- Arquivo compila sem erros TypeScript
