---
status: completed
parallelizable: false
blocked_by: ["1.0", "2.0"]
---

<task_context>
<domain>backend/api, frontend/forms</domain>
<type>bugfix</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>"sistema_end_to_end"</unblocks>
</task_context>

# Tarefa 7.0: Correções Pós-Validação — Auth PostgreSQL e Acessibilidade

## Visão Geral

Correção dos **2 problemas identificados pela validação** da AI Flow Validator após a entrega das tasks 1.0–6.0:

1. **[CRÍTICO]** `POST /api/auth/login` usa `state.users` (dados em memória do `seedData`), não o banco PostgreSQL. Qualquer usuário criado pelo CRUD admin (`POST /api/users`) não consegue fazer login no sistema operacional.
2. **[MENOR]** `<label>` em `UserFormPage.tsx` sem atributo `htmlFor` explicitamente vinculado ao `id` do campo correspondente — viola WCAG 2.1 AA.

**Fonte:** [`all-tasks-review.md`](../all-tasks-review.md) — Seção "Problemas Identificados".

---

## Subtarefas

### Problema 1 — [CRÍTICO] Migrar `authRoutes.ts` para PostgreSQL

- [ ] 7.1 Tornar `authRoutes.ts` `async` — reescrever `POST /api/auth/login` para buscar o usuário via `db.query('SELECT ... FROM users WHERE LOWER(username) = LOWER($1)', [username])`
- [ ] 7.2 Verificar `is_active = true` no SELECT — usuário inativo não deve conseguir fazer login (retornar `401` com mensagem `'Usuário desativado. Fale com um administrador.'`)
- [ ] 7.3 Substituir `checkPassword(password, user.passwordHash)` por `bcrypt.compare(password, row.password_hash)` usando o hash do banco
- [ ] 7.4 Adaptar o objeto passado a `signToken()` para usar os campos da linha do banco (`user_id`, `username`, `role`, `stall_id`, `display_name`)
- [ ] 7.5 Remover o import de `state` de `authRoutes.ts` — nenhuma rota de autenticação deve depender de dados em memória
- [ ] 7.6 Garantir que `GET /api/auth/me` continua funcionando (sem alterações necessárias — já usa `req.user` do middleware)
- [ ] 7.7 Testar fluxo completo: criar usuário via `POST /api/users` → fazer login via `POST /api/auth/login` → autenticar chamada com o token recebido

### Problema 2 — [MENOR] Acessibilidade: `htmlFor` nos formulários de admin

- [ ] 7.8 Em `UserFormPage.tsx` — adicionar `id` em cada `<input>` e `<select>` e o `htmlFor` correspondente no `<label>` pai:
  - `username` → `<label htmlFor="username">` + `<input id="username">`
  - `password` → `<label htmlFor="password">` + `<input id="password">`
  - `display_name` → `<label htmlFor="display_name">` + `<input id="display_name">`
  - `role` → `<label htmlFor="role">` + `<select id="role">`
- [ ] 7.9 Verificar `StallFormPage.tsx` e `ProductFormPage.tsx` pela mesma ausência e aplicar o mesmo padrão se necessário
- [ ] 7.10 Garantir que todos os campos de formulário admin passam em `tsc --noEmit` após as mudanças

---

## Detalhes de Implementação

### 7.1–7.6 — Novo `POST /api/auth/login` com PostgreSQL

```ts
// src/routes/authRoutes.ts — versão corrigida
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken } from '../auth';
import { requireAuth } from '../middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Informe usuário e senha.' });
    return;
  }

  try {
    // Busca no PostgreSQL (case-insensitive)
    const result = await db.query(
      `SELECT user_id, username, password_hash, role, stall_id, display_name, is_active
       FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );

    const row = result.rows[0];

    if (!row) {
      res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      return;
    }

    // Verificação de conta ativa
    if (!row.is_active) {
      res.status(401).json({ error: 'Usuário desativado. Fale com um administrador.' });
      return;
    }

    // Verificação de senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      return;
    }

    // Montar objeto compatível com signToken (interface User)
    const token = signToken({
      id: row.user_id,
      username: row.username,
      passwordHash: row.password_hash, // necessário pela interface User — não vai no token
      role: row.role,
      stallId: row.stall_id,
      displayName: row.display_name,
    });

    res.json({
      token,
      user: {
        id: row.user_id,
        username: row.username,
        role: row.role,
        stallId: row.stall_id,
        displayName: row.display_name,
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/me — sem alterações necessárias
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
```

### 7.8–7.9 — Padrão de acessibilidade para labels

```tsx
// Correto — label vinculado via htmlFor + id
<label htmlFor="username" className="text-xs font-semibold text-gray-300">
  Login (Username)
</label>
<input
  id="username"
  type="text"
  value={formData.username}
  onChange={...}
  className="..."
/>

// Incorreto — label sem vinculação explícita (padrão atual)
<label className="text-xs font-semibold text-gray-300">Login (Username)</label>
<input type="text" value={formData.username} ... />
```

---

## Sequenciamento

- Bloqueado por: 1.0 (tabela `users` deve existir), 2.0 (rota `POST /api/users` deve estar funcionando)
- Desbloqueia: Sistema completo end-to-end (operadores criados via admin conseguem fazer login)
- Paralelizável: Não (7.1–7.6 devem ser concluídos antes de testar fluxo completo)

---

## Critérios de Sucesso

### Problema 1 — Auth PostgreSQL
- Criar usuário `operator_teste` / `senha123` via `POST /api/users` com `role: 'operator'`
- `POST /api/auth/login` com `operator_teste` / `senha123` → retorna `200` com `token` e `user`
- Token gerado funciona em `GET /api/auth/me` e em rotas que exigem autenticação
- Usuário com `is_active = false` → `POST /api/auth/login` retorna `401` com mensagem de desativado
- `POST /api/auth/login` com senha errada → `401 'Usuário ou senha inválidos.'`
- Login do admin (`admin` / `admin123`) continua funcionando (usuário existe no banco via seed)
- `authRoutes.ts` não importa mais `state` de `../db`
- `tsc --noEmit` limpo

### Problema 2 — Acessibilidade
- Todos os `<input>` e `<select>` em `UserFormPage.tsx`, `StallFormPage.tsx` e `ProductFormPage.tsx` possuem atributo `id`
- Todos os `<label>` correspondentes possuem `htmlFor` igual ao `id` do campo
- Clicar no texto do label move o foco para o campo correto (teste manual)
- `tsc --noEmit` limpo após as mudanças
