---
status: pending
parallelizable: false
blocked_by: ["3.0", "4.0", "5.0"]
---

<task_context>
<domain>frontend/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server, external_apis</dependencies>
<unblocks>""</unblocks>
</task_context>

# Tarefa 6.0: Frontend — Módulo Produtos e Polimento Final

## Visão Geral

Implementação das telas de listagem e formulário de **Produtos** (alimentos e bebidas), incluindo o gerenciamento de subcategorias pelo admin. Em seguida, execução completa do checklist de qualidade UI, testes de integração das rotas críticas e documentação da migração do `seedData.js`.

Esta é a tarefa de entrega final — nenhuma feature deve ser marcada como completa sem o polimento e validação cobertos aqui.

## Requisitos

- Telas de produtos com filtro por barraca, categoria (`food`/`drink`) e status
- Formulário de produto com campo de preço formatado em BRL e validação de positivo
- Gerenciamento de subcategorias (criar e excluir) acessível na tela de produtos
- Checklist de qualidade UI 100% validado para **todas as telas** de admin (não só produtos)
- Testes de integração das rotas críticas do backend
- Produto desativado não aparece nas telas operacionais (PDV)
- Documentação do `seedData.js` atualizada (deprecação + instrução de seed inicial)

## Subtarefas

### Módulo Produtos
- [ ] 6.1 Implementar `src/hooks/useProducts.ts` — `useProducts(params)` e `useProductMutations()`; params: `search`, `stall_id`, `category_id`, `status`, `page`, `limit`
- [ ] 6.2 Implementar `src/hooks/useProductCategories.ts` — listar, criar e excluir subcategorias
- [ ] 6.3 Implementar `src/pages/admin/ProductsPage.tsx` — `DataTable` com colunas: nome, categoria, subcategoria, barraca, preço (BRL), status; filtros por barraca, `parent_type` e status; botão "Novo Produto"
- [ ] 6.4 Implementar painel de gerenciamento de subcategorias (inline ou drawer) em `ProductsPage` — listar, criar (input + botão) e excluir subcategorias por `parent_type`
- [ ] 6.5 Implementar `src/pages/admin/ProductFormPage.tsx` (criar + editar) — campos: `name`, `parent_type` (radio `Alimento`/`Bebida`), `category_id` (select dinâmico baseado no `parent_type`), `stall_id` (select de barracas ativas), `price` (input numérico, formatado em BRL), `is_active`
- [ ] 6.6 Validação de `price`: aceitar apenas número positivo; exibir erro "Preço deve ser maior que zero" no blur e no submit
- [ ] 6.7 Ícone de representação de produto: usar Lucide (`UtensilsCrossed` para alimento, `GlassWater` para bebida) no lugar de imagem/foto
- [ ] 6.8 Implementar ações de desativar e excluir produtos com `ConfirmModal`; tratar `409` para exclusão com pedido ativo
- [ ] 6.9 Verificar que produto desativado não aparece nas rotas operacionais do PDV (confirmar com backend ou ajustar filtro)

### Polimento e Qualidade
- [ ] 6.10 Executar checklist de qualidade UI completo (seção 10 da techspec) em **todas as telas de admin**
  - [ ] Visual: sem emojis, ícones consistentes, hover sem deslocamento, tokens de cor
  - [ ] Interação: cursor-pointer, hover com feedback, transições 150–300ms, foco visível, botão desativado no submit
  - [ ] Layout: responsivo em 375px / 768px / 1024px / 1440px, sem scroll horizontal
  - [ ] Acessibilidade: contraste ≥ 4,5:1, labels vinculadas, alt nas imagens, aria-label nos ícones de ação
- [ ] 6.11 Validar paridade visual com Figma para todas as telas implementadas (comparar screenshots)

### Testes de Integração (Backend)
- [ ] 6.12 Testar `POST /api/users` com username duplicado → `409`
- [ ] 6.13 Testar `DELETE /api/stalls/:id` com pedidos ativos → `409`
- [ ] 6.14 Testar `POST /api/products` com `price = -1` → `400`
- [ ] 6.15 Testar todas as rotas de admin sem token → `401`
- [ ] 6.16 Testar todas as rotas de admin com token de `operator` → `403`
- [ ] 6.17 Testar fluxo completo end-to-end: criar → editar → desativar → reativar → excluir para cada entidade

### Documentação e Migração
- [ ] 6.18 Adicionar comentário de deprecação no `seedData.js` indicando que ele serve apenas para setup inicial de banco
- [ ] 6.19 Documentar no README (ou `docs/`) o fluxo de seed inicial: `docker-compose up -d` → seed automático → acesso via admin

## Sequenciamento

- Bloqueado por: 3.0 (API de produtos), 4.0 (componentes base), 5.0 (módulos usuários e barracas)
- Desbloqueia: Nenhum (entrega final)
- Paralelizável: Não

## Detalhes de Implementação

**Formatação de preço:**
```ts
// Exibição na tabela e no formulário
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Envio para API: number puro (ex: 12.50), não string formatada
```

**Select dinâmico de subcategoria baseado em parent_type:**
```tsx
// Ao mudar o radio Alimento/Bebida:
// 1. Limpar category_id selecionado
// 2. Carregar subcategorias do tipo selecionado via GET /api/product-categories?parent_type=food
```

**Ícones de produto (Lucide):**
```tsx
import { UtensilsCrossed, GlassWater } from 'lucide-react';

const ProductIcon = ({ type }) =>
  type === 'food'
    ? <UtensilsCrossed className="w-5 h-5 text-text-secondary" />
    : <GlassWater className="w-5 h-5 text-text-secondary" />;
```

**Checklist de acessibilidade mínimo (por campo de formulário):**
```tsx
<label htmlFor="price" className="...">Preço</label>
<input
  id="price"
  type="number"
  min="0.01"
  step="0.01"
  aria-describedby="price-error"
  ...
/>
{error && <span id="price-error" className="text-error text-sm">{error}</span>}
```

**Referência:** [techspec.md — Seções 5.1, 6, 8, 10, 11 e 12](../techspec.md)

## Critérios de Sucesso

- `ProductsPage` filtra por barraca, subcategoria e status; paginação funciona
- `ProductFormPage`: `price = -1` → erro inline no campo; `price = 0` → erro inline
- Produto `is_active = false` ausente nas telas operacionais do PDV
- Subcategoria criada pelo admin aparece no select do formulário de produto
- Exclusão de subcategoria com produtos vinculados → mensagem de erro clara
- Checklist de qualidade UI (seção 10 da techspec) 100% marcado para todas as telas
- Testes de integração: todos os casos de `401`, `403`, `409` e `400` confirmados
- `tsc --noEmit` passa sem erros em todos os novos arquivos
- `seedData.js` com comentário de deprecação atualizado
- Fluxo completo end-to-end validado: criar → editar → desativar → excluir para Usuário, Barraca e Produto
