---
status: pending
parallelizable: false
blocked_by: ["1.0", "2.0"]
---

<task_context>
<domain>backend/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>"5.0, 6.0"</unblocks>
</task_context>

# Tarefa 3.0: Backend — CRUD de Barracas e Produtos

## Visão Geral

Implementação das rotas REST para **Barracas** (`/api/stalls`) e **Produtos** (`/api/products`), incluindo a relação N:M entre barracas e usuários (`stall_users`) e o gerenciamento de subcategorias de produto (`/api/product-categories`).

**Atenção:** Antes de criar as rotas de `/api/products`, auditar o backend existente para verificar se já existe alguma rota com esse nome — renomear a existente se necessário.

## Requisitos

- CRUD completo em `/api/stalls` com suporte à relação N:M com usuários
- CRUD completo em `/api/products` com filtro por barraca, categoria e status
- Endpoints para gerenciar subcategorias em `/api/product-categories`
- Bloqueio de exclusão com `409` quando há vínculos ativos (pedidos, usuários vinculados)
- `requireAdmin` aplicado em todas as rotas
- Preço validado como `> 0` e numérico no backend (além da constraint do banco)
- Listagem de barracas retorna usuários vinculados no `GET /api/stalls/:id`

## Subtarefas

- [ ] 3.1 Auditar rotas existentes no backend — verificar conflito com `/api/products` ou `/api/stalls`
- [ ] 3.2 Implementar `GET /api/stalls` — listagem com `search`, `status`, `type`, `page`, `limit`
- [ ] 3.3 Implementar `POST /api/stalls` — criar barraca + vincular `user_ids` em `stall_users` (transação)
- [ ] 3.4 Implementar `GET /api/stalls/:id` — retornar barraca com lista de usuários vinculados (JOIN `stall_users`)
- [ ] 3.5 Implementar `PUT /api/stalls/:id` — editar barraca + re-sincronizar `stall_users` (DELETE antigos + INSERT novos, em transação)
- [ ] 3.6 Implementar `PATCH /api/stalls/:id/status` — toggle `is_active`
- [ ] 3.7 Implementar `DELETE /api/stalls/:id` — verificar pedidos ativos e usuários vinculados antes de excluir; retornar `409` se houver vínculos
- [ ] 3.8 Implementar `GET /api/product-categories` — listagem com query param `parent_type` (`food` | `drink`)
- [ ] 3.9 Implementar `POST /api/product-categories` — criar nova subcategoria; validar que `parent_type` é `food` ou `drink`
- [ ] 3.10 Implementar `DELETE /api/product-categories/:id` — bloquear se houver produtos vinculados
- [ ] 3.11 Implementar `GET /api/products` — listagem com `search`, `stall_id`, `category_id`, `status`, `page`, `limit`
- [ ] 3.12 Implementar `POST /api/products` — validar `price > 0` e `typeof price === 'number'`; validar `stall_id` ativo; inserir
- [ ] 3.13 Implementar `GET /api/products/:id` — retornar produto com nome da barraca e categoria
- [ ] 3.14 Implementar `PUT /api/products/:id` — editar todos os campos; re-validar preço
- [ ] 3.15 Implementar `PATCH /api/products/:id/status` — toggle `is_active`; produto inativo não deve aparecer nas telas operacionais (PDV)
- [ ] 3.16 Implementar `DELETE /api/products/:id` — verificar pedidos ativos antes de excluir; retornar `409` se houver
- [ ] 3.17 Garantir que todas as rotas passam por `requireAdmin`
- [ ] 3.18 Testes manuais de todos os endpoints

## Sequenciamento

- Bloqueado por: 1.0 (tabelas), 2.0 (middleware `requireAdmin` pronto)
- Desbloqueia: 5.0, 6.0
- Paralelizável: Não com 2.0 (depende do middleware pronto)

## Detalhes de Implementação

**Sincronização N:M de barracas/usuários (em transação):**
```ts
// PUT /api/stalls/:id
await db.query('BEGIN');
await db.query('DELETE FROM stall_users WHERE stall_id = $1', [id]);
for (const userId of user_ids) {
  await db.query(
    'INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)',
    [id, userId]
  );
}
await db.query('COMMIT');
```

**Validação de preço no backend:**
```ts
if (typeof price !== 'number' || price <= 0) {
  return res.status(400).json({ error: 'Preço inválido — deve ser um número positivo' });
}
```

**Verificação de vínculos antes de exclusão:**
```sql
-- Verificar pedidos ativos vinculados à barraca
SELECT COUNT(*) FROM orders WHERE stall_id = $1 AND status = 'PENDING'
```

**Filtro de produtos ativos para telas operacionais (PDV):**
- Rotas operacionais já existentes devem usar `WHERE is_active = true` — verificar e adicionar se ausente.

**Referência:** [techspec.md — Seções 4.2, 4.3 e 4.4](../techspec.md)

## Critérios de Sucesso

- `POST /api/stalls` com `user_ids` → usuários vinculados em `stall_users` após criação
- `PUT /api/stalls/:id` com nova lista de `user_ids` → stall_users re-sincronizado corretamente
- `DELETE /api/stalls/:id` com pedidos ativos → `409` com mensagem clara
- `POST /api/products` com `price = -5` → `400` no backend (antes de chegar ao banco)
- `POST /api/products` com `stall_id` inativo → `400` ou `422`
- `PATCH /api/products/:id/status` → produto desativado não aparece no PDV
- `GET /api/products?stall_id=2&category_id=3&status=active` → filtragem correta
- Todas as rotas sem token → `401`; com token de `operator` → `403`
