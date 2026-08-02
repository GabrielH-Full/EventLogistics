---
status: pending
parallelizable: false
blocked_by: []
---

<task_context>
<domain>backend/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
<unblocks>"2.0, 3.0, 4.0"</unblocks>
</task_context>

# Tarefa 1.0: Database — Migrations e DDL

## Visão Geral

Criação de todas as tabelas novas necessárias para o CRUD de administração: `users`, `stalls`, `stall_users`, `product_categories` e `products`. Esta é a tarefa fundacional — nenhuma outra pode começar sem ela estar concluída.

Antes de executar o DDL, é obrigatório auditar o banco atual para verificar se já existem tabelas com nomes conflitantes (especialmente `products` e `users`), e adaptar o script se necessário.

## Requisitos

- PostgreSQL 16 via Docker (conforme ADR-001)
- `BIGINT GENERATED ALWAYS AS IDENTITY` para todas as PKs
- `NUMERIC(10,2)` para o campo `price` — nunca `FLOAT`/`REAL`
- `TIMESTAMPTZ` para todos os campos de data/hora
- `TEXT` para strings (sem `VARCHAR(n)`)
- Índices B-Tree manuais em todas as colunas de FK
- Soft delete via coluna `is_active BOOLEAN NOT NULL DEFAULT true`
- Seed das subcategorias padrão na tabela `product_categories`

## Subtarefas

- [ ] 1.1 Auditar banco atual — verificar existência de `users`, `products`, `stalls` e possíveis conflitos de schema
- [ ] 1.2 Criar (ou adaptar) tabela `users` com colunas: `user_id`, `username`, `password`, `role`, `is_active`, `created_at`, `updated_at`
- [ ] 1.3 Criar índice `UNIQUE` em `LOWER(username)` para garantir unicidade case-insensitive
- [ ] 1.4 Criar tabela `stalls` com colunas: `stall_id`, `name`, `type`, `is_active`, `created_at`, `updated_at`
- [ ] 1.5 Criar tabela `stall_users` (N:M) com PK composta `(stall_id, user_id)` e FKs para `stalls` e `users` com `ON DELETE CASCADE`
- [ ] 1.6 Criar índices em `stall_users(user_id)` e `stall_users(stall_id)`
- [ ] 1.7 Criar tabela `product_categories` com colunas: `category_id`, `name`, `parent_type` com `CHECK (parent_type IN ('food', 'drink'))` e `UNIQUE(name, parent_type)`
- [ ] 1.8 Criar (ou adaptar) tabela `products` com colunas: `product_id`, `stall_id`, `category_id`, `name`, `price NUMERIC(10,2)`, `is_active`, `created_at`, `updated_at`
- [ ] 1.9 Criar índices em `products(stall_id)`, `products(category_id)` e índice parcial `products(is_active) WHERE is_active = true`
- [ ] 1.10 Executar seed das subcategorias padrão com `ON CONFLICT DO NOTHING`
- [ ] 1.11 Validar DDL no ambiente de desenvolvimento com `\d+ <tabela>` no psql

## Sequenciamento

- Bloqueado por: Nenhum
- Desbloqueia: 2.0, 3.0, 4.0
- Paralelizável: Não (é a fundação de todas as outras tarefas)

## Detalhes de Implementação

```sql
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
```

**Regras de constraint críticas:**
- `price NUMERIC(10,2) NOT NULL CHECK (price > 0)` — nunca aceitar preço negativo ou zero no banco
- `role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator'))`
- `ON DELETE RESTRICT` em `products.stall_id` — impede exclusão de barraca com produtos vinculados
- `ON DELETE CASCADE` em `stall_users` — limpeza automática ao excluir usuário ou barraca

**Referência completa do DDL:** [techspec.md — Seção 3.1](../techspec.md)

## Critérios de Sucesso

- Todas as 5 tabelas criadas sem erros no ambiente Docker local
- `\d+ users`, `\d+ stalls`, `\d+ products` confirmam schema correto
- Subcategorias padrão presentes em `product_categories`
- Índices de FK visíveis em `\di` para todas as tabelas
- Nenhum campo usa `FLOAT`, `REAL`, `VARCHAR(n)` ou `TIMESTAMP` (sem TZ)
- `INSERT` com `price = -1` falha com constraint violation (teste manual)
