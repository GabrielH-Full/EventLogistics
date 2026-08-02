# Tech Spec: CRUD Web — Gestão de Usuários, Barracas e Produtos

**PRD de referência:** [prd.md](./prd.md)
**Versão:** v1.0 | **Data:** 2026-08-01 | **Status:** Rascunho
**ADR de banco:** [adr-001-postgres-database.md](../../documents/adr-001-postgres-database.md)

---

## Resumo Executivo

Esta especificação técnica cobre a implementação das telas de CRUD administrativo para **Usuários**, **Barracas** e **Produtos** (alimentos e bebidas) no EventLogistics. A solução substitui completamente as edições manuais em `seedData.js`, entregando uma interface web exclusiva para a conta `admin`.

A arquitetura segue o padrão já estabelecido no projeto: **React + Vite + React Router** no frontend com **Tailwind CSS** e **Lucide React** para UI, e **Node.js + Express** no backend com **PostgreSQL 16 (Docker)** via driver `pg`. O banco de dados já foi migrado conforme o ADR-001; esta feature adiciona as novas entidades e endpoints sem quebrar os contratos existentes.

---

## 1. Design de Frontend (Figma → Implementação)

### 1.1 Links do Figma por Módulo

| Módulo | Tela / Variante | Link do Figma | Node ID |
|---|---|---|---|
| Gestão de Usuários | Tela principal (listagem) | [Abrir no Figma](https://www.figma.com/design/UdDVzoe0RZrejJZKk8yNRu/Sem-t%C3%ADtulo?node-id=1-2&m=dev) | `1:2` |
| Gestão de Barracas | Tela principal (listagem) | [Abrir no Figma](https://www.figma.com/design/UdDVzoe0RZrejJZKk8yNRu/Sem-t%C3%ADtulo?node-id=1-170&m=dev) | `1:170` |
| Gestão de Usuários (variante) | Estado alternativo | [Abrir no Figma](https://www.figma.com/design/UdDVzoe0RZrejJZKk8yNRu/Sem-t%C3%ADtulo?node-id=4-290&m=dev) | `4:290` |

**fileKey do arquivo Figma:** `UdDVzoe0RZrejJZKk8yNRu`

### 1.2 Fluxo obrigatório de implementação (ai-creative-design)

```
1. get_design_context (node-id)   → estrutura, tokens e espaçamentos do nó
2. get_screenshot (node-id)       → referência visual da variante exata
3. Download dos assets            → ícones/imagens do payload Figma (NÃO criar placeholders)
4. Implementação                  → React + Tailwind alinhado ao design system
5. Validação                      → paridade 1:1 com a captura do Figma
```

> ⚠️ **IMPORTANTE:** Assets retornados como `localhost` pelo Figma MCP devem ser usados diretamente. Não adicionar novos pacotes de ícones — todos os assets visuais devem vir do payload do Figma.

### 1.3 Stack e Convenções de Frontend

| Campo | Valor |
|---|---|
| Framework | React + Vite |
| Roteamento | React Router v6 |
| Estilização | Tailwind CSS |
| Linguagem | TypeScript |
| Ícones | Lucide React (sem emojis como ícones) |
| Fontes | Import no `index.css` |
| Gráficos | Não aplicável nesta feature |
| Estado local | `useState` + `useReducer` |
| Busca de dados | `fetch` nativo + hooks customizados |
| Formulários | Estado controlado com validação manual |

**Convenções de código:**
- Componentes: `export function NomeDoComponente()` (função nomeada)
- Props: interface TypeScript definida acima do componente
- Classes: Tailwind utilitários; sem `style={{}}` inline exceto casos excepcionais
- `cursor-pointer` obrigatório em todos os elementos clicáveis
- Transições: `transition-colors duration-200` como padrão

---

## 2. Arquitetura do Sistema

### 2.1 Visão Geral dos Componentes

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
│    ├── users.ts          /api/users                     │
│    ├── stalls.ts         /api/stalls                    │
│    └── products.ts       /api/products                  │
│                                                         │
│  src/middleware/                                        │
│    └── requireAdmin.ts   (JWT + role check)             │
│                                                         │
│  src/db.ts               (Pool de conexões pg)          │
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

## 3. Modelagem de Banco de Dados (PostgreSQL)

> Seguindo as regras do ADR-001 e do `postgres-template.md`:
> - `BIGINT GENERATED ALWAYS AS IDENTITY` para PKs
> - `NUMERIC(10,2)` para preços
> - `TIMESTAMPTZ` para carimbos de tempo
> - `TEXT` para strings (sem `VARCHAR(n)`)
> - Índices manuais em todas as FKs
> - `snake_case` para todos os identificadores

### 3.1 DDL — Novas Tabelas

```sql
-- ============================================================
-- USERS (estende a tabela existente ou cria se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username   TEXT        NOT NULL UNIQUE,
    password   TEXT        NOT NULL,                   -- bcrypt hash
    role       TEXT        NOT NULL DEFAULT 'operator'
                           CHECK (role IN ('admin', 'operator')),
    is_active  BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
    ON users (LOWER(username));

-- ============================================================
-- STALLS (barracas)
-- ============================================================
CREATE TABLE IF NOT EXISTS stalls (
    stall_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT        NOT NULL,
    type       TEXT        NOT NULL,                   -- tipo/categoria da barraca
    is_active  BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- STALL_USERS (N:M — múltiplos usuários por barraca)
-- ============================================================
CREATE TABLE IF NOT EXISTS stall_users (
    stall_id   BIGINT NOT NULL REFERENCES stalls (stall_id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users  (user_id)  ON DELETE CASCADE,
    PRIMARY KEY (stall_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stall_users_user_id  ON stall_users (user_id);
CREATE INDEX IF NOT EXISTS idx_stall_users_stall_id ON stall_users (stall_id);

-- ============================================================
-- PRODUCT_CATEGORIES (subcategorias gerenciadas pelo admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
    category_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL,
    parent_type   TEXT NOT NULL CHECK (parent_type IN ('food', 'drink')),
    UNIQUE (name, parent_type)
);

-- Seed das subcategorias padrão
INSERT INTO product_categories (name, parent_type) VALUES
    ('Pastel',       'food'),
    ('Pizza',        'food'),
    ('Doce',         'food'),
    ('Outros',       'food'),
    ('Refrigerante', 'drink'),
    ('Suco',         'drink'),
    ('Água',         'drink'),
    ('Outros',       'drink')
ON CONFLICT (name, parent_type) DO NOTHING;

-- ============================================================
-- PRODUCTS (alimentos e bebidas)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    product_id  BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stall_id    BIGINT         NOT NULL REFERENCES stalls (stall_id) ON DELETE RESTRICT,
    category_id BIGINT         NOT NULL REFERENCES product_categories (category_id),
    name        TEXT           NOT NULL,
    price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    is_active   BOOLEAN        NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_stall_id    ON products (stall_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON products (is_active) WHERE is_active = true;
```

### 3.2 Regras de Integridade

| Regra | Implementação |
|---|---|
| Username único (case-insensitive) | `UNIQUE INDEX ON users (LOWER(username))` |
| Senha nunca em texto plano | Hash bcrypt no backend antes do INSERT |
| Preço sempre positivo | `CHECK (price > 0)` + validação no backend |
| Preço com precisão monetária | `NUMERIC(10,2)` — nunca `FLOAT` |
| Barraca com pedidos ativos bloqueada para exclusão | `ON DELETE RESTRICT` + verificação na rota |
| Soft delete preferido | Coluna `is_active BOOLEAN` em todas as entidades |
| Múltiplos usuários por barraca | Tabela de junção `stall_users` (N:M) |

---

## 4. API REST — Endpoints

> Todos os endpoints exigem `Authorization: Bearer <JWT>` com `role = admin`.
> Prefixo base: `/api`

### 4.1 Usuários (`/api/users`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/users` | Listar usuários (query: `search`, `status`, `role`, `page`, `limit`) |
| `POST` | `/api/users` | Criar novo usuário |
| `GET` | `/api/users/:id` | Buscar usuário por ID |
| `PUT` | `/api/users/:id` | Editar usuário existente |
| `PATCH` | `/api/users/:id/status` | Ativar / desativar (soft delete) |
| `DELETE` | `/api/users/:id` | Excluir definitivamente (com verificação de vínculos) |

**Body de criação / edição:**
```ts
interface CreateUserBody {
  username: string;      // obrigatório, único
  password: string;      // obrigatório na criação
  role: 'admin' | 'operator';
  is_active?: boolean;   // default: true
  stall_ids?: number[];  // barracas vinculadas
}
```

### 4.2 Barracas (`/api/stalls`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/stalls` | Listar barracas (query: `search`, `status`, `type`, `page`, `limit`) |
| `POST` | `/api/stalls` | Criar nova barraca |
| `GET` | `/api/stalls/:id` | Buscar barraca por ID (inclui usuários vinculados) |
| `PUT` | `/api/stalls/:id` | Editar barraca existente |
| `PATCH` | `/api/stalls/:id/status` | Ativar / desativar |
| `DELETE` | `/api/stalls/:id` | Excluir (com verificação de pedidos ativos) |

**Body de criação / edição:**
```ts
interface CreateStallBody {
  name: string;           // obrigatório
  type: string;           // tipo/categoria da barraca
  is_active?: boolean;    // default: true
  user_ids?: number[];    // usuários responsáveis
}
```

### 4.3 Produtos (`/api/products`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/products` | Listar produtos (query: `search`, `stall_id`, `category_id`, `status`, `page`, `limit`) |
| `POST` | `/api/products` | Criar novo produto |
| `GET` | `/api/products/:id` | Buscar produto por ID |
| `PUT` | `/api/products/:id` | Editar produto existente |
| `PATCH` | `/api/products/:id/status` | Ativar / desativar |
| `DELETE` | `/api/products/:id` | Excluir (com verificação de pedidos ativos) |

**Body de criação / edição:**
```ts
interface CreateProductBody {
  stall_id: number;       // obrigatório
  category_id: number;    // obrigatório
  name: string;           // obrigatório
  price: number;          // obrigatório, > 0
  is_active?: boolean;    // default: true
}
```

### 4.4 Categorias de Produto (`/api/product-categories`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/product-categories` | Listar categorias (query: `parent_type`) |
| `POST` | `/api/product-categories` | Criar nova subcategoria |
| `DELETE` | `/api/product-categories/:id` | Excluir subcategoria (sem produtos vinculados) |

### 4.5 Formato de Resposta Padrão

```ts
// Sucesso
{ data: T, message?: string }

// Listagem com paginação
{ data: T[], total: number, page: number, limit: number }

// Erro
{ error: string, details?: string }
```

### 4.6 Middleware de Autorização

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

---

## 5. Design de Frontend — Componentes e Páginas

### 5.1 Estrutura de Rotas (React Router)

```tsx
// Rotas protegidas — exigem role=admin
<Route path="/admin" element={<AdminGuard />}>
  <Route path="users"              element={<UsersPage />} />
  <Route path="users/new"          element={<UserFormPage mode="create" />} />
  <Route path="users/:id/edit"     element={<UserFormPage mode="edit" />} />
  <Route path="stalls"             element={<StallsPage />} />
  <Route path="stalls/new"         element={<StallFormPage mode="create" />} />
  <Route path="stalls/:id/edit"    element={<StallFormPage mode="edit" />} />
  <Route path="products"           element={<ProductsPage />} />
  <Route path="products/new"       element={<ProductFormPage mode="create" />} />
  <Route path="products/:id/edit"  element={<ProductFormPage mode="edit" />} />
</Route>
```

### 5.2 Componente `DataTable`

Componente reutilizado pelas três listagens. Responsável por:
- Renderizar colunas configuráveis via props
- Paginação (estado local, sincronizado com query params)
- Busca e filtros (debounce de 300ms)
- Estados: loading (skeleton rows), empty, error

```tsx
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  isLoading: boolean;
  onSearch?: (value: string) => void;
  onFilter?: (key: string, value: string) => void;
  onPageChange?: (page: number) => void;
  actions?: (row: T) => React.ReactNode;
}
```

### 5.3 Componente `ConfirmModal`

Modal de confirmação para ações destrutivas. Sempre exibido antes de desativar ou excluir.

```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;    // default: "Confirmar"
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

### 5.4 Hooks de Dados

```ts
// src/hooks/useUsers.ts
export function useUsers(params: UserListParams) {
  // Retorna: { users, total, isLoading, error, refetch }
  // Gerencia: paginação, busca, filtros
}

export function useUserMutations() {
  // Retorna: { createUser, updateUser, toggleStatus, deleteUser }
  // Cada função: async, lança erro em caso de falha, chama refetch
}
```

---

## 6. Estados da UI — Requisitos por Tela

### 6.1 Telas de Listagem (Users / Stalls / Products)

| Estado | Comportamento |
|---|---|
| **Loading** | Skeleton rows (3–5 linhas placeholder animadas) |
| **Empty** | Ícone Lucide + mensagem + botão "Novo Cadastro" |
| **Error** | Mensagem de erro + botão "Tentar novamente" |
| **Com dados** | Tabela com paginação, busca e filtros |
| **Hover em linha** | Highlight sutil de fundo (`bg-surface-hover`) |
| **Ação de exclusão** | Abre `ConfirmModal` antes de executar |

### 6.2 Telas de Formulário (Criar / Editar)

| Estado | Comportamento |
|---|---|
| **Inicial** | Campos vazios (criar) ou pré-preenchidos (editar) |
| **Validação** | Erros inline abaixo de cada campo (tempo real no blur) |
| **Salvando** | Botão de submit desativado + spinner |
| **Sucesso** | Toast de sucesso + redirect para listagem |
| **Erro de API** | Toast de erro com mensagem da API |
| **Username duplicado** | Erro inline no campo de username |

---

## 7. Controle de Acesso

### 7.1 Frontend — Guarda de Rota

```tsx
// src/components/AdminGuard.tsx
export function AdminGuard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
```

### 7.2 Backend — Middleware

Todas as rotas `/api/users`, `/api/stalls` e `/api/products` são protegidas pelo middleware `requireAdmin` (ver Seção 4.6).

- Requisição sem token → `401 Unauthorized`
- Token válido mas `role !== 'admin'` → `403 Forbidden`

---

## 8. Regras de Negócio Críticas

### 8.1 Exclusão com Vínculos Ativos

Antes de executar `DELETE` definitivo, o backend deve verificar:

| Entidade | Verificação |
|---|---|
| Usuário | Tem sessões ativas ou pedidos abertos associados? |
| Barraca | Tem pedidos em aberto (`status = 'PENDING'`)? |
| Produto | Tem itens em pedidos abertos? |

Se sim → retornar `409 Conflict` com sugestão de desativação.

### 8.2 Senha

- Armazenada como hash `bcrypt` (custo mínimo: 12)
- Nunca exposta em nenhuma rota GET
- Na edição: campo de senha opcional — se vazio, mantém o hash atual

### 8.3 Preço dos Produtos

- Tipo: `NUMERIC(10,2)` no banco
- Validação no backend: `price > 0` e `typeof price === 'number'`
- Exibição no frontend: formatado como moeda BRL (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`)

### 8.4 Subcategorias de Produto

- Gerenciadas pelo admin via `/api/product-categories`
- Tipos fixos: `food` e `drink`
- Subcategorias padrão inseridas via seed
- Admin pode criar novas subcategorias dentro de cada tipo

---

## 9. Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Risco | Ação Requerida |
|---|---|---|---|
| `seedData.js` | Deprecação gradual | Passa a ser usado apenas em dev para setup inicial | Documentar + adicionar comentário de deprecação |
| Rotas existentes de `/api/products` | Possível conflito de nome | Verificar se já existe — renomear se necessário | Auditar backend antes de criar |
| Tabela `products` (existente) | Schema extension | Adicionar FK `category_id` se a tabela já existir | Migration cuidadosa com `ADD COLUMN` |
| Autenticação JWT | Adição de campo `role` | Verificar se `role` já está no payload do token | Garantir que `role` está no JWT gerado no login |
| Telas operacionais (PDV) | Impacto indireto | Produtos desativados não devem aparecer no PDV | Filtrar por `is_active = true` nas rotas operacionais |

---

## 10. Checklist de Qualidade UI

### Acessibilidade (CRÍTICO)
- [ ] Contraste de texto ≥ 4,5:1 em todos os elementos
- [ ] Estados de foco visíveis (`outline: 2px solid primary`)
- [ ] Todos os inputs com `<label htmlFor>` vinculado
- [ ] Botões de apenas ícone com `aria-label`
- [ ] Tamanho mínimo de alvo de toque: 44×44px
- [ ] Formulários navegáveis por teclado

### Interação
- [ ] `cursor-pointer` em todos os elementos clicáveis
- [ ] Feedback visual em hover (cor, sombra ou borda)
- [ ] Transições de 150–300ms (`transition-colors duration-200`)
- [ ] Botão de submit desativado durante operação assíncrona
- [ ] `ConfirmModal` antes de qualquer ação destrutiva

### Layout
- [ ] Responsivo: 375px, 768px, 1024px, 1440px
- [ ] Sem rolagem horizontal em nenhum breakpoint
- [ ] Conteúdo não escondido atrás de navbar fixa

### Paridade com Figma
- [ ] Screenshot do Figma comparado com implementação (todos os 3 node-ids)
- [ ] Espaçamentos, tamanhos de fonte e cores conferem
- [ ] Assets usam fontes do Figma MCP, não placeholders

---

## 11. Abordagem de Testes

### 11.1 Testes Unitários (Frontend)
- Hooks (`useUsers`, `useStalls`, `useProducts`): lógica de fetch, estados loading/error/data
- `DataTable`: renderização com dados, estado vazio, paginação
- `ConfirmModal`: abertura, fechamento, callbacks de confirmação/cancelamento
- Validações de formulário: campos obrigatórios, preço positivo, username único

### 11.2 Testes de Integração (Backend)
- `POST /api/users` com username duplicado → `409`
- `DELETE /api/stalls/:id` com pedidos ativos → `409`
- `POST /api/products` com preço negativo → `400`
- Acesso às rotas sem token → `401`
- Acesso com token de `operator` → `403`

### 11.3 Verificação Manual
- Testar todos os estados da UI por tela (loading, empty, error, com dados)
- Testar fluxo completo: criar → editar → desativar → reativar → excluir para cada entidade
- Verificar que produto desativado não aparece no PDV

---

## 12. Sequenciamento de Desenvolvimento

### Fase 1 — Banco de Dados e Backend
1. Executar DDL das novas tabelas (`users`, `stalls`, `stall_users`, `product_categories`, `products`)
2. Verificar compatibilidade com tabelas existentes (audit antes do DDL)
3. Implementar middleware `requireAdmin`
4. Implementar rotas de `users` (listagem + CRUD)
5. Implementar rotas de `stalls` (listagem + CRUD)
6. Implementar rotas de `products` e `product-categories`

### Fase 2 — Componentes Base de Frontend
7. Criar `AdminGuard` e configurar rotas protegidas
8. Criar `DataTable` (componente reutilizável)
9. Criar `ConfirmModal`
10. Criar `StatusBadge`, `SearchInput`, `FilterSelect`

### Fase 3 — Módulo Usuários
11. Extrair design do Figma (`node-id=1:2`, `node-id=4:290`)
12. Implementar `UsersPage` + `useUsers`
13. Implementar `UserFormPage` (criar + editar)

### Fase 4 — Módulo Barracas
14. Extrair design do Figma (`node-id=1:170`)
15. Implementar `StallsPage` + `useStalls`
16. Implementar `StallFormPage` (criar + editar)

### Fase 5 — Módulo Produtos
17. Implementar `ProductsPage` + `useProducts`
18. Implementar `ProductFormPage` (criar + editar + subcategorias)

### Fase 6 — Polimento e Validação
19. Validar paridade 1:1 com os screenshots do Figma
20. Executar checklist de qualidade UI completo (Seção 10)
21. Testes de integração das rotas críticas
22. Documentar migração do `seedData.js` → banco

---

## 13. Considerações Técnicas

### Decisões Principais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Banco de dados | PostgreSQL 16 (Docker) | ADR-001 — já adotado no projeto |
| Soft delete | Coluna `is_active` | Preserva histórico de vendas sem perder os vínculos |
| Preço monetário | `NUMERIC(10,2)` | ADR-001 — evita erros de arredondamento IEEE 754 |
| Relação barraca/usuário | Tabela `stall_users` (N:M) | PRD: cada barraca pode ter múltiplos responsáveis |
| Subcategorias de produto | Tabela `product_categories` | Admin pode criar novas; não é enum fixo no banco |
| Ícones de produto | Lucide React | PRD: sem upload de imagem — representado por ícones |
| Autenticação | JWT existente com campo `role` | Reutilizar mecanismo já existente no sistema |

### Riscos Conhecidos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Tabela `products` já existe com schema diferente | Média | Auditar banco antes do DDL; usar `ADD COLUMN IF NOT EXISTS` |
| Campo `role` ausente no JWT atual | Baixa | Verificar payload no login; adicionar se necessário |
| Conflito de rotas `/api/products` | Média | Auditar backend existente antes de criar as novas rotas |
| Exclusão de usuário com sessão ativa | Baixa | Verificar tabela de sessões/tokens antes do DELETE |

### Conformidade com Padrões do Projeto

- ✅ PostgreSQL 16 com `NUMERIC(10,2)`, `TIMESTAMPTZ`, `BIGINT GENERATED ALWAYS AS IDENTITY` (ADR-001)
- ✅ Sem `FLOAT`/`REAL` para valores monetários (ADR-001 + postgres-template)
- ✅ Índices manuais em todas as FKs (ADR-001 + postgres-template)
- ✅ React + Tailwind + Lucide React (stack do projeto)
- ✅ Paridade visual com Figma via Figma MCP (ai-creative-design)
- ✅ Acessibilidade WCAG: contraste 4,5:1, labels, foco, toque 44px (ui-ux-pro-max)
- ✅ Soft delete preferido sobre hard delete (PRD — requisito funcional 4.2 e 10.2)

---

_Última atualização: 2026-08-01 · Baseado em: PRD prd.md + ADR-001 + ai-techspec-creator + ai-ui-ux-pro-max + ai-creative-design_
