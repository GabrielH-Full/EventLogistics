---
status: completed
parallelizable: false
blocked_by: ["3.0"]
---

<task_context>
<domain>engine/api_routes</domain>
<type>integration</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
<unblocks>["5.0"]</unblocks>
</task_context>

# Tarefa 4.0: Refatoração dos Handlers das Rotas HTTP Express

## Visão Geral

Refatorar todos os arquivos de rotas em `src/routes/` transformando-os em adaptadores HTTP enxutos. As rotas devem apenas validar a estrutura das requisições, invocar o método apropriado do Service e capturar erros de domínio mapeando-os para os status HTTP corretos (400, 403, 404, 409, 500).

## Requisitos

- Refatorar `ticketRoutes.ts` consumindo `TicketService`.
- Refatorar `productRoutes.ts` consumindo `InventoryService`.
- Refatorar `adminProductRoutes.ts` consumindo `ProductService`.
- Refatorar `adminStallRoutes.ts` consumindo `StallService`.
- Refatorar `userRoutes.ts` consumindo `UserService`.
- Refatorar `productCategoryRoutes.ts` consumindo `CategoryService`.
- Nenhuma rota deve conter comandos SQL diretos ou invocar `db.query`/`broadcastState`.

## Subtarefas

- [x] 4.1 Instanciar/injetar os Services nas rotas (via startup central ou módulos de rota).
- [x] 4.2 Refatorar `src/routes/ticketRoutes.ts` com tratamento tipado de `InsufficientStockError`, `NotFoundError`, `ForbiddenError`.
- [x] 4.3 Refatorar `src/routes/productRoutes.ts` delegando produção e reset ao `InventoryService`.
- [x] 4.4 Refatorar `src/routes/userRoutes.ts` e rotas administrativas (`adminProductRoutes.ts`, `adminStallRoutes.ts`, `productCategoryRoutes.ts`).
- [x] 4.5 Executar smoke tests manuais em todas as rotas validando respostas JSON e status HTTP.

## Sequenciamento

- Bloqueado por: 3.0
- Desbloqueia: 5.0
- Paralelizável: Não (alteração direta nos pontos de entrada da API)

## Detalhes de Implementação

```typescript
// Exemplo de handler enxuto
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'O carrinho está vazio.' });
  }
  try {
    const ticket = await ticketService.createTicket(items, req.user!.sub);
    return res.status(201).json({ ticket });
  } catch (err) {
    if (err instanceof InsufficientStockError) return res.status(409).json({ error: err.message });
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof ForbiddenError) return res.status(403).json({ error: err.message });
    return res.status(500).json({ error: 'Erro interno ao processar operação.' });
  }
});
```

## Critérios de Sucesso

- Rotas Express reduzidas a validadores e adaptadores de entrada/saída.
- Zero queries SQL e zero chamadas diretas de WebSocket nas rotas.
- Total paridade de contratos e respostas com o comportamento original.\n