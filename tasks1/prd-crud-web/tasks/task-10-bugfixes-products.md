---
status: pending
parallelizable: false
blocked_by: ["9.0"]
---

<task_context>
<domain>backend/api, frontend/forms</domain>
<type>bugfix</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>"sistema_end_to_end_v2"</unblocks>
</task_context>

# Tarefa 10.0: Correções do Módulo de Produtos (Fase 2)

## Visão Geral
Com base na especificação técnica de correções (`techspec-bugs.md`), esta tarefa estabiliza os erros críticos no formulário e rotas de produtos.

## Objetivos e Escopo

### 1. Backend (`adminProductRoutes.ts`)
- **B3.1 e B3.3 - Erro 400 e 500 no Salvar/Editar:** Revisar as consultas `INSERT` e `UPDATE` (`PUT /api/products/:id`). Garantir que recebem dados numéricos bem formatados (`price`, `stall_id`, `category_id`), checar todas as vírgulas e aspas do SQL, bem como ordem dos placeholders (`$1, $2`).
- **B3.2 - Filtro de Status Sem Resultados:** Ajustar parse do booleano e a cláusula `WHERE is_active = $1` em `GET /api/products`.
- **B3.4 - Categoria Não Exibida:** A rota `GET /api/products` deve incluir a string legível do nome da categoria (ex: usando `LEFT JOIN product_categories`). 

### 2. Frontend (`ProductFormPage.tsx` e `ProductsPage.tsx`)
- **B3.1 - Parsing de Preço (Erros 400):** Garantir que o `price` enviado não chegue como uma string com vírgula ou em branco. Adicionar validação ou formatador que limpe `NaN` transformando-o com segurança num número float (`10.50`) antes do submit.
- **B3.4 - Listagem:** Atualizar as colunas da tabela em `ProductsPage.tsx` para garantir que o identificador legível da categoria (retornado da API após a correção da query com JOIN) preencha a célula corretamente.

## Restrições
- A tabela `products` exige validação `price > 0`. Trate o erro na UI sem estourar o backend.
- Garanta testes diretos pelo payload enviado no `fetch` para não ocorrer rejeições silently (invisíveis).
