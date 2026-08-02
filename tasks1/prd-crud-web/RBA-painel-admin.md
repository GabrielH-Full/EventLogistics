# Relatório de Bugs e Ajustes — Painel Administrativo

Este documento lista os problemas identificados em três páginas do sistema (`UserFormPage`, `StallFormPage` e `ProductFormPage`), separados por: **bugs a corrigir**, **funcionalidades a remover** e **lógicas a refazer**.

---

## 1. UserFormPage

### 1.1 Bugs a corrigir

1. **Barraca associada não aparece no painel após criação do usuário**
   Ao criar um novo usuário e associá-lo a uma barraca, essa associação não é refletida no painel após a criação.

2. **Formulário de edição carrega em branco**
   Ao clicar em "Editar Usuário", os dados do usuário deveriam preencher automaticamente o formulário de edição, mas os campos aparecem vazios.

3. **Erro ao excluir usuário**
   A funcionalidade de exclusão de usuário apresenta erro (necessário investigar comportamento atual e mensagem retornada, pois não há detalhes adicionais registrados).

4. **Lógica de filtros incorreta**
   - Filtro **"Inativos"**: continua exibindo usuários com `status: ativo`.
   - Filtro **"Ativos"**: continua exibindo usuários com `status: inativo`.
   - Filtro de cargo **"Operador"**: nem todos os usuários com cargo "Operador" aparecem no resultado filtrado (alguns ficam de fora indevidamente).

---

## 2. StallFormPage

### 2.1 Bugs a corrigir

1. **Lógica de filtro de status incorreta**
   O filtro de status não está separando corretamente as barracas: barracas com `status: ativo` continuam aparecendo no filtro de inativos, e barracas com `status: inativo` continuam aparecendo no filtro de ativos (mesmo padrão de erro do filtro de `UserFormPage`).

### 2.2 Funcionalidades a remover

1. **Opção de adicionar ícone** — não deve existir ao criar uma nova barraca.
2. **Seção "Operadores Vinculados"** — não deve existir na criação de barraca. Essa associação já é feita na página `UserFormPage`, no momento da criação do usuário.

### 2.3 Lógica a refazer

1. **Campo "Tipo"**: deve ser reimplementado como botões (`type="button"`), com as opções **"Alimento"** ou **"Bebida"**, seguindo o mesmo padrão já utilizado em `ProductFormPage`.
2. **Campo "Categoria"**: deve ser um seletor no formato de botões (`type="button"`), cujas opções disponíveis dependem do "Tipo" selecionado anteriormente.

---

## 3. ProductFormPage

### 3.1 Bugs a corrigir

1. **Erro ao salvar novo produto (400 Bad Request)**
   Ao preencher todos os campos do formulário e clicar em "Salvar Produto", ocorre o seguinte erro, mesmo com os campos preenchidos:

   ```
   Campos name, stall_id, category_id, price são obrigatórios.
   ```

   Contexto adicional retornado no erro:

   ```json
   {
     "allowedRoles": ["admin"],
     "loading": false,
     "path": "/admin/products/new",
     "user": {
       "displayName": "Caixa Central",
       "role": "admin",
       "stallId": "full",
       "sub": "1",
       "username": "admin"
     }
   }
   ```

   ```
   Failed to load resource: the server responded with a status of 400 (Bad Request)
   ```

2. **Filtro de status não funcional**
   O filtro de status em `ProductFormPage` não retorna nenhum resultado.

3. **Erro ao editar produto (500 Internal Server Error)**
   Ao tentar editar um produto, ocorre o seguinte erro de forma persistente:

   ```
   Failed to load resource: the server responded with a status of 500 (Internal Server Error)
   PUT http://localhost:3001/api/products/pastel_carne 500 (Internal Server Error)
   (client.ts:27)
   ```

4. **Categoria não exibida após criação de produto**
   Após criar um novo produto, a categoria associada (no formato `Categoria:Subcategoria`) não aparece no painel.

---

## Resumo por prioridade sugerida

| Página | Problema | Tipo |
|---|---|---|
| UserFormPage | Barraca não reflete após criação | Bug |
| UserFormPage | Formulário de edição vazio | Bug |
| UserFormPage | Erro ao excluir usuário | Bug |
| UserFormPage | Filtros de status e cargo incorretos | Bug |
| StallFormPage | Filtro de status incorreto | Bug |
| StallFormPage | Ícone na criação | Remover |
| StallFormPage | Operadores Vinculados na criação | Remover |
| StallFormPage | Campo "Tipo" como botões | Refazer |
| StallFormPage | Campo "Categoria" dependente do "Tipo" | Refazer |
| ProductFormPage | Erro 400 ao salvar novo produto | Bug |
| ProductFormPage | Filtro de status sem resultados | Bug |
| ProductFormPage | Erro 500 ao editar produto | Bug |
| ProductFormPage | Categoria não exibida após criação | Bug |