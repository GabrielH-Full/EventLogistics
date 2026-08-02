---
status: pending
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>"3.0, 5.0"</unblocks>
</task_context>

# Tarefa 2.0: Backend — Middleware e CRUD de Usuários

## Visão Geral

Implementação do middleware de autorização `requireAdmin` e das rotas REST completas para gerenciamento de usuários (`/api/users`). Inclui listagem com filtros/paginação, criação, edição, ativação/desativação e exclusão com verificação de vínculos.

O campo `role` deve estar presente no payload do JWT — verificar antes de implementar o guard.

## Requisitos

- Middleware `requireAdmin` verificando `Authorization: Bearer <JWT>` e `role === 'admin'`
- CRUD completo em `/api/users` (GET, POST, GET/:id, PUT/:id, PATCH/:id/status, DELETE/:id)
- Senhas armazenadas com `bcrypt` (custo mínimo 12) — nunca em texto plano
- Username único validado de forma case-insensitive
- Soft delete preferido (PATCH status) sobre hard delete
- Hard delete bloqueado se usuário tiver vínculos ativos
- Listagem com paginação (`page`, `limit`) e busca (`search`, `status`, `role`)
- Respostas no formato padrão: `{ data, message }` / `{ data, total, page, limit }` / `{ error }`

## Subtarefas

- [ ] 2.1 Verificar se o payload do JWT atual já contém o campo `role` — adicionar ao `signToken` se ausente
- [ ] 2.2 Implementar `src/middleware/requireAdmin.ts` — verificar token JWT e `role === 'admin'`; retornar `401` sem token, `403` com role inválido
- [ ] 2.3 Implementar `GET /api/users` — listagem com query params `search`, `status`, `role`, `page`, `limit`; busca por `LOWER(username) LIKE LOWER(%search%)`
- [ ] 2.4 Implementar `POST /api/users` — validar campos obrigatórios, verificar username duplicado (`LOWER`), hash bcrypt, inserir e retornar usuário criado (sem campo `password`)
- [ ] 2.5 Implementar `GET /api/users/:id` — retornar usuário com barracas vinculadas (JOIN em `stall_users`)
- [ ] 2.6 Implementar `PUT /api/users/:id` — editar `username`, `role`, `is_active`, `stall_ids`; se `password` enviado, re-hashear; bloquear username duplicado
- [ ] 2.7 Implementar `PATCH /api/users/:id/status` — toggle `is_active`; usuário inativo não deve conseguir autenticar
- [ ] 2.8 Implementar `DELETE /api/users/:id` — verificar vínculos ativos antes de excluir; retornar `409` com sugestão de desativação se houver vínculos
- [ ] 2.9 Aplicar `requireAdmin` em todas as rotas de `/api/users`
- [ ] 2.10 Garantir que nenhuma resposta inclua o campo `password` (hash ou texto plano)
- [ ] 2.11 Testes manuais: criar usuário, editar, desativar, tentar login com inativo (deve falhar), excluir

## Sequenciamento

- Bloqueado por: 1.0 (tabelas devem existir)
- Desbloqueia: 3.0, 5.0
- Paralelizável: Não (depende de 1.0; desbloqueia 3.0)
- **4.0 pode rodar em paralelo com esta tarefa** (componentes base de frontend não dependem da API)

## Detalhes de Implementação

```ts
// src/middleware/requireAdmin.ts
export function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autenticado' });

  const payload = verifyJWT(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  req.user = payload;
  next();
}
```

```ts
// Exemplo de resposta de listagem
{
  data: User[],
  total: number,
  page: number,
  limit: number
}

// Nunca expor password:
const { password, ...safeUser } = user;
return res.json({ data: safeUser });
```

**Body esperado para criação:**
```ts
interface CreateUserBody {
  username: string;
  password: string;
  role: 'admin' | 'operator';
  is_active?: boolean;
  stall_ids?: number[];
}
```

**Verificação de username duplicado:**
```sql
SELECT user_id FROM users WHERE LOWER(username) = LOWER($1) AND user_id != $2
```

**Referência:** [techspec.md — Seções 4.1 e 4.6](../techspec.md)

## Critérios de Sucesso

- `POST /api/users` sem token → `401`
- `POST /api/users` com token de `operator` → `403`
- `POST /api/users` com username duplicado (maiúsculas/minúsculas) → `409`
- `POST /api/users` com dados válidos → usuário criado, `password` ausente na resposta
- `PATCH /api/users/:id/status` → `is_active` alterna corretamente
- Login com usuário `is_active = false` → falha na autenticação
- `DELETE /api/users/:id` com vínculos → `409` com mensagem clara
- `GET /api/users?search=jo&role=operator` → filtragem correta
