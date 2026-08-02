---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>frontend/components</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
<unblocks>"5.0, 6.0"</unblocks>
</task_context>

# Tarefa 4.0: Frontend — Componentes Base e Roteamento

## Visão Geral

Criação dos componentes reutilizáveis de admin e configuração das rotas protegidas. Esta tarefa pode rodar **em paralelo com a Tarefa 2.0** — não depende das rotas de API estarem prontas, apenas das tabelas existindo (para validar tipos TypeScript).

Os componentes criados aqui (`DataTable`, `ConfirmModal`, `StatusBadge`, `SearchInput`, `FilterSelect`) serão reusados por todas as telas de admin nas Tarefas 5.0 e 6.0.

## Requisitos

- Stack: React + TypeScript + Tailwind CSS + Lucide React
- Componente `AdminGuard` protegendo rotas com `role === 'admin'`
- `DataTable` genérico com suporte a colunas configuráveis, paginação, busca e estados
- `ConfirmModal` para todas as ações destrutivas
- Hooks customizados com fetch + estados `loading`, `error`, `data`
- Todos os elementos clicáveis com `cursor-pointer`
- Transições de `150–300ms` em interações

## Subtarefas

- [ ] 4.1 Configurar rotas protegidas em `App.tsx` ou `router.tsx` — adicionar `/admin/*` com `<AdminGuard>`
- [ ] 4.2 Implementar `src/components/AdminGuard.tsx` — verificar `user.role === 'admin'`; redirecionar para `/login` se não autenticado e para `/unauthorized` se role inválido
- [ ] 4.3 Implementar `src/components/admin/DataTable.tsx` — colunas via props, paginação (estado local + query params), estados: loading (skeleton rows), empty (ícone + CTA), error (mensagem + retry)
- [ ] 4.4 Implementar `src/components/admin/ConfirmModal.tsx` — `isOpen`, `title`, `description`, `onConfirm`, `onCancel`, `isLoading`, `variant: 'danger' | 'warning'`; deve travar scroll do body quando aberto
- [ ] 4.5 Implementar `src/components/admin/StatusBadge.tsx` — exibir `Ativo`/`Inativo` com cores semânticas (verde/cinza); usar ícone Lucide (`CheckCircle`/`XCircle`)
- [ ] 4.6 Implementar `src/components/admin/SearchInput.tsx` — campo de busca com debounce de 300ms; ícone `Search` do Lucide
- [ ] 4.7 Implementar `src/components/admin/FilterSelect.tsx` — select de filtro reutilizável com label e opções via props
- [ ] 4.8 Implementar `src/hooks/useAdminFetch.ts` — hook base com `fetch`, estados `{ data, isLoading, error, refetch }`; reutilizado pelos hooks específicos
- [ ] 4.9 Criar `src/hooks/useUsers.ts`, `useStalls.ts`, `useProducts.ts` como wrappers do hook base (esqueleto — lógica de chamada implementada nas tarefas 5.0 e 6.0)
- [ ] 4.10 Criar páginas placeholder para todas as rotas de admin (apenas JSX com título) para validar o roteamento antes das telas finais
- [ ] 4.11 Verificar que `AdminGuard` redireciona corretamente para usuário não-admin e não-autenticado

## Sequenciamento

- Bloqueado por: 1.0 (para tipagem TypeScript das entidades)
- Desbloqueia: 5.0, 6.0
- Paralelizável: **Sim** — pode rodar em paralelo com 2.0

## Detalhes de Implementação

```tsx
// src/components/AdminGuard.tsx
export function AdminGuard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
```

```tsx
// Rotas protegidas
<Route path="/admin" element={<AdminGuard />}>
  <Route path="users"           element={<UsersPage />} />
  <Route path="users/new"       element={<UserFormPage mode="create" />} />
  <Route path="users/:id/edit"  element={<UserFormPage mode="edit" />} />
  <Route path="stalls"          element={<StallsPage />} />
  <Route path="stalls/new"      element={<StallFormPage mode="create" />} />
  <Route path="stalls/:id/edit" element={<StallFormPage mode="edit" />} />
  <Route path="products"             element={<ProductsPage />} />
  <Route path="products/new"         element={<ProductFormPage mode="create" />} />
  <Route path="products/:id/edit"    element={<ProductFormPage mode="edit" />} />
</Route>
```

```tsx
// Interface do DataTable
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

**Estados visuais do DataTable:**
- `isLoading`: renderizar 5 linhas com `animate-pulse bg-surface rounded h-4` (skeleton)
- `data.length === 0`: ícone Lucide + texto "Nenhum registro encontrado" + botão de ação primária
- `error`: ícone `AlertCircle` + mensagem + botão "Tentar novamente" chamando `refetch`

**Referência:** [techspec.md — Seções 5.1, 5.2 e 5.3](../techspec.md)

## Critérios de Sucesso

- Acessar `/admin/users` sem token redireciona para `/login`
- Acessar `/admin/users` com token de `operator` redireciona para `/unauthorized`
- `DataTable` renderiza skeleton em `isLoading`, mensagem vazia em `data=[]`, e tabela com dados
- `ConfirmModal` abre e fecha corretamente; botão de confirmação fica em loading durante `isLoading=true`
- `SearchInput` dispara callback apenas após 300ms sem digitação (debounce funcionando)
- Todos os componentes sem erros TypeScript (`tsc --noEmit` passa)
- `cursor-pointer` presente em todos os botões e linhas clicáveis da tabela
