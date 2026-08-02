# Tech Spec: CRUD Web — Gestão de Usuários, Barracas e Produtos (Versão Final Consolidada)

**PRD de referência:** [prd.md](./prd.md)
**Versão:** v2.0 | **Data:** 2026-08-02 | **Status:** Finalizado
**ADR de banco:** [adr-001-postgres-database.md](../../documents/adr-001-postgres-database.md)

---

## Resumo Executivo

Esta especificação técnica detalha a implementação atual das telas de CRUD administrativo para **Usuários**, **Barracas** e **Produtos** (alimentos e bebidas) no EventLogistics. Esta versão atualizada reflete o estado final do sistema após a migração do `seedData.js` para PostgreSQL, incluindo as correções de bugs, ajustes de permissão de acesso e refatorações de interface.

A arquitetura usa **React + Vite + React Router** no frontend com **Tailwind CSS** e **Lucide React** para UI, e **Node.js + Express** no backend com **PostgreSQL 16 (Docker)** via driver `pg`.

---

## 1. Arquitetura do Sistema

### 1.1 Visão Geral dos Componentes

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                   │
│                                                         │
│  src/pages/admin/                                       │
│    ├── UsersPage.tsx          (listagem de usuários)    │
│    ├── UserFormPage.tsx       (criar / editar usuário)  │
│    ├── StallsPage.tsx         (listagem de barracas)    │
│    ├── StallFormPage.tsx      (criar / editar barraca)  │
│    ├── ProductsPage.tsx       (listagem de produtos)    │
│    └── ProductFormPage.tsx    (criar / editar produto)  │
│                                                         │
│  src/components/admin/                                  │
│    ├── DataTable.tsx          (tabela reutilizável)     │
│    ├── ConfirmModal.tsx       (modal de confirmação)    │
│    ├── StatusBadge.tsx        (badge ativo/inativo)     │
│    ├── SearchInput.tsx        (campo de busca)          │
│    └── FilterSelect.tsx       (select de filtros)       │
│                                                         │
│  src/hooks/                                             │
│    ├── useUsers.ts                                      │
│    ├── useStalls.ts                                     │
│    └── useProducts.ts                                   │
└─────────────────────────────────────────────────────────┘
              │  HTTP REST (JSON)  │
              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express + Node.js)           │
│                                                         │
│  src/routes/                                            │
│    ├── authRoutes.ts         (Login e Token)            │
│    ├── userRoutes.ts         /api/users                 │
│    ├── adminStallRoutes.ts   /api/stalls                │
│    ├── adminProductRoutes.ts /api/products              │
│    └── productRoutes.ts      /api/products/:id/prod...  │
│                                                         │
│  src/middleware/                                        │
│    ├── requireAuth.ts    (Autenticação genérica)        │
│    ├── requireAdmin.ts   (Somente admins)               │
│    └── requireRole.ts    (Validação de múltiplos papéis)│
└─────────────────────────────────────────────────────────┘
              │  SQL (pg driver)  │
              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│           PostgreSQL 16 (Docker Container)              │
│                                                         │
│  Tabelas: users, stalls, stall_users,                   │
│           product_categories, products                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Modelagem de Banco de Dados (PostgreSQL)

O banco de dados foi estendido e migrado com sucesso, respeitando:
- `BIGINT GENERATED ALWAYS AS IDENTITY` (para novas entidades) ou uso de `TEXT`/`UUID` onde havia compatibilidade necessária.
- `NUMERIC(10,2)` para preços.
- Soft deletes usando a coluna `is_active BOOLEAN`.

### 2.1 Principais Tabelas
- **users:** Armazena administradores e operadores. Possui `user_id`, `username`, `password` (bcrypt), `role` (`admin`, `stall`, `operator`).
- **stalls:** Barracas de venda. (A gestão de operadores não é salva diretamente na barraca para evitar acoplamento).
- **stall_users:** Tabela de junção N:M (Barraca <-> Usuário). Muito útil para operadores de vendas logarem e o sistema saber qual barraca eles operam.
- **product_categories:** Categoria e seu super-tipo (ex: Pastel -> food, Refrigerante -> drink).
- **products:** Estoque individual de produtos atrelados a categorias e barracas (`stall_id`).

---

## 3. Segurança e Regras de Negócio Implementadas

### 3.1 Controle de Autenticação (Login e Token)
- **Problema resolvido:** Usuários criados não possuíam o `stallId` no token de sessão (JWT), pois eram vinculados via `stall_users` ao invés da tabela principal `users`.
- **Solução implementada:** O endpoint `POST /api/auth/login` agora executa um `LEFT JOIN` / `SELECT` na tabela `stall_users` quando o campo `stallId` nativo do usuário é nulo. O token passa a carregar o ID correto da barraca, garantindo permissão em rotas de operação.

### 3.2 Precedência de Rotas (Conflito de Permissão)
- **Problema resolvido:** A rota `adminProductRoutes` (`/api/products`) estava interceptando chamadas para `/api/products/:id/production` dos operadores, retornando `403 Forbidden` devido à exigência global de Administrador.
- **Solução implementada:** Em `server.ts`, a ordem de registro das rotas foi invertida. Agora `productRoutes` escuta antes, processando operações de estoque, enquanto `adminProductRoutes` processa o CRUD apenas para `admin`.

### 3.3 Formulários e Associação Visual (Nome da Barraca)
- **Interface de Barracas:** A edição de Barracas não controla mais quais usuários estão nela. O fluxo correto é "Criar o Usuário e vincular a uma Barraca". Essa simplificação resolveu loops lógicos e limpou o `StallFormPage`.
- **Campos nativos:** A categoria de barracas no `StallFormPage` foi convertida de botões soltos para um `<select>` nativo, corrigindo problemas de compatibilidade e tipagem do formulário.
- **AppBar da Barraca (`StallApp.tsx`):** Anteriormente o sistema utilizava `user.displayName` (Nome do usuário) no topo da tela do operador. O sistema foi alterado para consultar o array global de barracas e usar o NOME REAL da barraca cadastrada baseada no `user.stallId`.

### 3.4 Filtros de Listagem no Painel Admin
Os filtros foram completamente estabilizados.
- **Rotas de Listagem (GET):** Corrigido para consumir os query params corretos (`req.query.is_active` em vez de `req.query.status`, e `req.query.parent_type` para classificar entre Comidas e Bebidas).
- As consultas `SQL` foram devidamente unidas via `LEFT JOIN` quando necessário (ex: `product_categories` ao filtrar por `parent_type`).

### 3.5 Reset de Estoque (Fallback)
A funcionalidade de Reset de Estoque do operador, usada para demonstrações, foi aprimorada:
- Se o produto for um produto original do Seed, ele volta à sua quantidade inicial predefinida.
- Se o produto foi criado manualmente pelo Admin (e não existe no Seed), o seu estoque é **zerado** automaticamente.

---

## 4. API REST — Endpoints Atuais

### 4.1 Usuários (`/api/users`)
- `GET /api/users` - Lista paginada (Query Params: `search`, `is_active`, `role`)
- `POST /api/users` - Cria usuário (cria vínculo em `stall_users` caso envie `stall_ids`)
- `PUT /api/users/:id` - Atualiza usuário (recria vínculos em `stall_users`)
- `PATCH /api/users/:id/status` - Ativa/Inativa
- `DELETE /api/users/:id` - Exclui usuário

### 4.2 Barracas (`/api/stalls`)
- `GET /api/stalls` - Lista paginada (Query Params: `search`, `is_active`, `type`)
- `POST /api/stalls`
- `PUT /api/stalls/:id`
- `PATCH /api/stalls/:id/status`
- `DELETE /api/stalls/:id`

### 4.3 Produtos (`/api/products`)
*Rotas do Administrador (`adminProductRoutes.ts`)*
- `GET /api/products` - Lista paginada (Query Params: `search`, `stall_id`, `parent_type`, `is_active`)
- `POST /api/products`
- `PUT /api/products/:id`
- `PATCH /api/products/:id/status`
- `DELETE /api/products/:id`

*Rotas do Operador (`productRoutes.ts`)*
- `POST /api/products/:id/production` - Adiciona estoque.
- `POST /api/stalls/:stallId/reset` - Reseta estoque.

---

## 5. Abordagem de Frontend 

| Componente | Detalhe |
|---|---|
| **AdminGuard** | Intercepta navegações e redireciona caso `user.role !== 'admin'`. Suporta role `operator` para áreas restritas. |
| **DataTable** | Reutilizado e estabilizado. Exibe dados paginados perfeitamente, comunicando a contagem total recebida da API. |
| **ConfirmModal** | Prevê remoção destrutiva. Notifica com "Conflict 409" se o usuário tentar remover entidades que possuem dependências de venda no banco de dados. |

---

## 6. Estado Final do Projeto (Bugs Resolvidos)

1. **[RESOLVIDO] 403 Forbidden no Estoque**: Corrigida a colisão de rotas no Express (`server.ts`).
2. **[RESOLVIDO] Filtros Quebrados**: Os parâmetros de API para Status (`is_active`) e Categoria/Tipo (`parent_type`) agora correspondem perfeitamente entre Client e Server. Variáveis errôneas como `joinString` isoladas incorretamente em rotas de Barracas foram removidas.
3. **[RESOLVIDO] Falta de Associação no Login**: O login injeta corretamente a propriedade `stallId` no payload do JWT do usuário puxando da tabela `stall_users`.
4. **[RESOLVIDO] Nomenclatura no App da Barraca**: `StallApp.tsx` agora prioriza a propriedade `name` cruzando `user.stallId` com `useAppData()`.
5. **[RESOLVIDO] Redefinição de Estoque**: Zera completamente os estoques de produtos que não pertencem à base original (seed).
6. **[RESOLVIDO] Typescript Compile Errors**: Erro na conversão para TypeScript no tipo de usuário global que não reconhecia `operator` foi adicionado em `types.ts`.

---
_Fim do Documento Técnico v2.0 - Consolidado e finalizado_
