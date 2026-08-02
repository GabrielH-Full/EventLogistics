---
status: pending
parallelizable: false
blocked_by: ["2.0", "3.0", "4.0"]
---

<task_context>
<domain>frontend/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server, external_apis</dependencies>
<unblocks>"6.0"</unblocks>
</task_context>

# Tarefa 5.0: Frontend — Módulos Usuários e Barracas

## Visão Geral

Implementação das telas de listagem e formulário para **Usuários** e **Barracas**, com paridade visual 1:1 em relação ao design do Figma. Utiliza os componentes base criados na Tarefa 4.0 e consome as rotas de API das Tarefas 2.0 e 3.0.

O fluxo obrigatório de implementação segue a skill `ai-creative-design`:
1. `get_design_context` para os node-ids do Figma
2. `get_screenshot` para referência visual
3. Download dos assets do Figma (ícones/imagens)
4. Implementação alinhada ao design system
5. Validação de paridade 1:1

## Requisitos

- Paridade visual 1:1 com Figma (node-ids: `1:2`, `4:290` para usuários; `1:170` para barracas)
- Telas de listagem com busca, filtros, paginação e todos os estados (loading, empty, error)
- Formulários com validação em tempo real (no blur), mensagens de erro inline
- `ConfirmModal` antes de qualquer desativação ou exclusão
- `StatusBadge` exibindo status ativo/inativo em cada linha da tabela
- Ícones Lucide React — sem emojis
- `cursor-pointer` em todos os elementos clicáveis
- Responsivo: 375px, 768px, 1024px, 1440px

## Subtarefas

### Módulo Usuários
- [ ] 5.1 Extrair design do Figma — `get_design_context` + `get_screenshot` para `node-id=1:2` e `node-id=4:290`
- [ ] 5.2 Implementar `src/hooks/useUsers.ts` — `useUsers(params)` retorna `{ users, total, isLoading, error, refetch }` e `useUserMutations()` com `{ createUser, updateUser, toggleStatus, deleteUser }`
- [ ] 5.3 Implementar `src/pages/admin/UsersPage.tsx` — `DataTable` com colunas: nome, role, barracas vinculadas, status; busca por nome; filtros por `role` e `status`; botão "Novo Usuário"
- [ ] 5.4 Implementar `src/pages/admin/UserFormPage.tsx` (modo criar) — campos: `username`, `password`, `role` (select), `stall_ids` (multiselect); validação no blur; submit com loading; toast de sucesso e redirect
- [ ] 5.5 Implementar `UserFormPage.tsx` (modo editar) — mesmos campos, pré-preenchidos; campo `password` opcional (manter hash se vazio); toast de sucesso
- [ ] 5.6 Implementar ação de desativar usuário — botão na linha da tabela → `ConfirmModal` (variant `warning`) → `PATCH /api/users/:id/status`
- [ ] 5.7 Implementar ação de excluir usuário — botão na linha da tabela → `ConfirmModal` (variant `danger`) → `DELETE /api/users/:id`; tratar `409` com mensagem sugerindo desativação
- [ ] 5.8 Validar paridade visual com screenshots do Figma (`node-id=1:2` e `node-id=4:290`)

### Módulo Barracas
- [ ] 5.9 Extrair design do Figma — `get_design_context` + `get_screenshot` para `node-id=1:170`
- [ ] 5.10 Implementar `src/hooks/useStalls.ts` — análogo ao `useUsers`, com suporte a `user_ids`
- [ ] 5.11 Implementar `src/pages/admin/StallsPage.tsx` — `DataTable` com colunas: nome, tipo, usuários responsáveis, status; busca por nome; filtros por `type` e `status`; botão "Nova Barraca"
- [ ] 5.12 Implementar `src/pages/admin/StallFormPage.tsx` (criar + editar) — campos: `name`, `type` (select/input), `user_ids` (multiselect de usuários cadastrados); validação; toast de sucesso
- [ ] 5.13 Implementar ações de desativar e excluir barracas com `ConfirmModal`; tratar `409` para exclusão com vínculo
- [ ] 5.14 Validar paridade visual com screenshot do Figma (`node-id=1:170`)

## Sequenciamento

- Bloqueado por: 2.0 (API de usuários), 3.0 (API de barracas), 4.0 (componentes base)
- Desbloqueia: 6.0
- Paralelizável: Não (todos os bloqueadores devem estar concluídos)

## Detalhes de Implementação

**Figma MCP — Fluxo obrigatório:**
```
fileKey: UdDVzoe0RZrejJZKk8yNRu

Usuários — Tela principal:  node-id = 1:2
Usuários — Variante:        node-id = 4:290
Barracas — Tela principal:  node-id = 1:170
```

**Hook de usuários:**
```ts
export function useUsers(params: UserListParams) {
  // GET /api/users?search=&role=&status=&page=&limit=
  return { users, total, isLoading, error, refetch };
}

export function useUserMutations() {
  return {
    createUser:   (body: CreateUserBody)  => Promise<User>,
    updateUser:   (id, body: UpdateUser)  => Promise<User>,
    toggleStatus: (id: number)            => Promise<void>,
    deleteUser:   (id: number)            => Promise<void>,
  };
}
```

**Estados de formulário:**
- Campo obrigatório vazio no blur → mensagem vermelha abaixo do campo
- Submit → botão desativado + spinner (nunca duplo submit)
- Sucesso → toast verde + `navigate('/admin/users')`
- Erro 409 (username duplicado) → erro inline no campo `username`

**Checklist de UI para cada tela:**
- [ ] `cursor-pointer` em linhas da tabela e botões de ação
- [ ] Hover na linha da tabela com `bg-surface-hover`
- [ ] Transições de `150–300ms`
- [ ] Labels vinculadas a todos os campos (`htmlFor`)
- [ ] Estados de foco visíveis (outline azul/primary)
- [ ] Responsivo: sem scroll horizontal em 375px

**Referência:** [techspec.md — Seções 5, 6 e 7](../techspec.md)

## Critérios de Sucesso

- Screenshots do Figma comparados com implementação — paridade visual confirmada para os 3 node-ids
- `UsersPage` exibe skeleton em loading, mensagem vazia quando sem dados, tabela com dados reais
- `UserFormPage` (criar): campos validados, usuário criado na API, redirect com toast
- `UserFormPage` (editar): dados pré-preenchidos, edição salva, password mantido se campo vazio
- Desativar usuário: `ConfirmModal` → status alternado → `StatusBadge` atualizado na listagem
- Excluir usuário com vínculos: `409` exibido com mensagem de desativação sugerida
- `StallFormPage`: multiselect de usuários funcionando; barraca criada com relação N:M
- Sem erros no console do browser
- `tsc --noEmit` passa sem erros TypeScript
- Responsivo em 375px, 768px, 1024px, 1440px sem scroll horizontal
