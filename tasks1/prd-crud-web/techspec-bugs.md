# Tech Spec: Correções e Ajustes — CRUD Admin (Fase 2)

**Documentos de Referência:**
- RBA: [RBA-painel-admin.md](./RBA-painel-admin.md)
- PRD Original: [prd.md](./prd.md)
- Tech Spec Original: [techspec.md](./techspec.md)

---

## 1. Visão Geral
Este documento detalha o plano de ação técnico para corrigir os bugs reportados, remover funcionalidades não desejadas e refatorar a lógica de campos no Painel Administrativo. As intervenções abrangem os formulários e listagens de **Usuários**, **Barracas** e **Produtos**, englobando correções no Frontend (React) e Backend (Node.js/Express + PostgreSQL).

---

## 2. Especificações por Módulo

### 2.1 Módulo: Usuários (`UserFormPage` e `UsersPage`)

#### 2.1.1 Bugs a Corrigir

| Ref | Problema | Causa Raiz Provável | Solução Técnica |
|---|---|---|---|
| **B1.1** | Barraca não aparece após criação | O backend pode não estar inserindo na tabela `stall_users` ao receber o array `stall_ids` no `POST /api/users` ou a listagem `GET /api/users` não está fazendo `JOIN` para trazer as barracas. | **Backend:** Verificar `POST /api/users` para garantir que `INSERT INTO stall_users` seja executado dentro da transação. Verificar `GET /api/users` para garantir que o array `stalls` esteja sendo preenchido no payload de resposta (ex: `jsonb_agg`). |
| **B1.2** | Formulário de edição vazio | O `useEffect` do modo `edit` não está encontrando o usuário (ex: diferença de tipos no `id`, string vs number) ou não está preenchendo o `formData` corretamente. | **Frontend:** Em `UserFormPage.tsx`, revisar o `useEffect` de carga. Garantir que a conversão `Number(id)` case com o dado retornado e que `formData` receba os valores exatos vindos da API. |
| **B1.3** | Erro ao excluir usuário | Restrições de chave estrangeira (FK) não tratadas corretamente na exclusão ou falha na query `DELETE` no backend. | **Backend:** Revisar `DELETE /api/users/:id`. Se houver FKs críticas (vendas/sessões), retornar `409 Conflict`. Caso contrário, garantir que a exclusão propague (CASCADE) ou tratar o erro adequadamente. |
| **B1.4** | Filtros de status/cargo incorretos | Na rota `GET /api/users`, a conversão do parâmetro de query (string 'true'/'false') para booleano ou a cláusula `WHERE` para 'role' estão incorretas. | **Backend:** Em `userRoutes.ts`, garantir que `req.query.status` converta estritamente `'true'` para booleano e valide a filtragem. Corrigir as cláusulas `WHERE` para `status` e `role`. |

---

### 2.2 Módulo: Barracas (`StallFormPage` e `StallsPage`)

#### 2.2.1 Bugs a Corrigir

| Ref | Problema | Causa Raiz Provável | Solução Técnica |
|---|---|---|---|
| **B2.1** | Filtro de status incorreto | Semelhante ao módulo de usuários. O parâmetro `is_active` não está sendo montado corretamente na cláusula `WHERE` do SQL. | **Backend:** Em `adminStallRoutes.ts`, ajustar a conversão do parâmetro `status` e sua inserção na query array. |

#### 2.2.2 Funcionalidades a Remover

| Ref | Remoção | Ação Técnica |
|---|---|---|
| **R2.1** | Ocultar ícone na criação | **Frontend:** Em `StallFormPage.tsx`, condicionar a renderização do input `icon` apenas se `mode === 'edit'`. |
| **R2.2** | Remover "Operadores Vinculados" | **Frontend:** Remover a seção inteira do formulário de criação. A associação ocorre inversamente a partir do `UserFormPage`. |

#### 2.2.3 Lógicas a Refazer

| Ref | Refatoração | Ação Técnica |
|---|---|---|
| **F2.1** | Campo "Tipo" como botões | **Frontend:** Substituir o campo de input atual por 2 botões (Alimento / Bebida), utilizando `type="button"`. Atualizar `formData.type` no onClick. |
| **F2.2** | Campo "Categoria" dependente | **Frontend:** Adicionar um grid de botões para subcategorias que mude de acordo com o "Tipo" selecionado (ex: Pastel, Pizza para alimento; Suco, Água para bebida). |

---

### 2.3 Módulo: Produtos (`ProductFormPage` e `ProductsPage`)

#### 2.3.1 Bugs a Corrigir

| Ref | Problema | Causa Raiz Provável | Solução Técnica |
|---|---|---|---|
| **B3.1** | Erro 400 ao salvar | Dados numéricos (`price`, `stall_id`, `category_id`) sendo enviados como string vazia, ou parsing de moeda falhando no envio. | **Frontend/Backend:** Assegurar que `price` seja limpo de formatações (R$) e enviado como número float. No backend (`adminProductRoutes.ts`), validar conversões corretas e garantir que não trave em `NaN`. |
| **B3.2** | Filtro de status sem resultados | Query no backend possivelmente injetando boolean como string, quebrando a consulta PostgreSQL. | **Backend:** Revisar em `adminProductRoutes.ts` a forma como `req.query.status` é adicionado aos `whereClauses`. |
| **B3.3** | Erro 500 ao editar produto | Rota `PUT /api/products/:id` quebrando no backend (possivelmente erro na query SQL ou variáveis incorretas). | **Backend:** Analisar logs da rota `PUT`. Corrigir SQL (cláusulas `SET`, vírgulas ausentes ou tipagem dos argumentos). |
| **B3.4** | Categoria não exibe após criação | Frontend depende de `subcategory_name` ou similar, que o `GET` da listagem não está retornando (Falta de JOIN com `product_categories`). | **Backend:** Revisar `GET /api/products` para assegurar o uso de um `LEFT JOIN product_categories c ON p.category_id = c.category_id` e projetar `c.name as subcategory_name`. |

---

## 3. Plano de Verificação

Após as correções implementadas, a verificação deve seguir o roteiro:

1. **User:** Criar usuário > Selecionar barraca > Voltar à listagem e conferir barraca. Editar usuário criado. Testar filtros (ativo, inativo, operador). Excluir usuário.
2. **Stall:** Tentar criar barraca (não deve mostrar ícone nem operadores). Testar seletores de botões para tipo e categoria. Testar filtros.
3. **Product:** Cadastrar produto testando parsing de preço. Conferir se categoria aparece na listagem. Editar o produto criado (não pode dar 500). Testar filtro de status.

---

## 4. Recomendações Arquiteturais Baseadas nos Bugs

- **Conversão de Query Params:** Centralizar a lógica de conversão de filtros (ex: `req.query.status === 'true'`) para evitar duplicação e falhas em múltiplos endpoints.
- **Tipagem de Formulários Frontend:** Garantir que campos como `stall_id` e `category_id` sejam convertidos estritamente para inteiro antes de enviar no `body` da requisição para prevenir o erro 400.
