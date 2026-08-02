---
status: pending
parallelizable: false
blocked_by: ["7.0"]
---

<task_context>
<domain>backend/api, frontend/forms</domain>
<type>bugfix</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>9.0, 10.0</unblocks>
</task_context>

# Tarefa 8.0: Correções do Módulo de Usuários (Fase 2)

## Visão Geral
Com base na especificação técnica de correções (`techspec-bugs.md`), esta tarefa foca em estabilizar o módulo de Usuários, corrigindo as falhas de edição, filtros e associação com barracas.

## Objetivos e Escopo

### 1. Backend (`userRoutes.ts`)
- **B1.1 - Persistência de Barracas:** Ao receber requisições `POST` ou `PUT` em usuários, garantir que o array de barracas seja atualizado na tabela de junção `stall_users`. A rota `GET /api/users` também deve retornar as barracas vinculadas ao usuário de forma transparente (ex: usando um `jsonb_agg` ou um select secundário no map).
- **B1.3 - Exclusão de Usuários:** Tratar de forma correta o `DELETE /api/users/:id`, cuidando de potenciais restrições de chave estrangeira (retornar HTTP 409 se necessário) ou se valendo da cascata caso configurado.
- **B1.4 - Filtros:** Corrigir os filtros `status` e `role` em `GET /api/users`. Garantir que a conversão de `'true'`/`'false'` para booleano ocorra adequadamente.

### 2. Frontend (`UserFormPage.tsx` e `UsersPage.tsx`)
- **B1.2 - Formulário Vazio:** No modo de edição (`UserFormPage`), garantir que o estado inicialize corretamente os dados quando a API retornar a resposta, se atentando a não falhar na igualdade estrita `id === Number(id)` e populando o array de barracas vinculadas.

## Restrições
- Não alterar a assinatura dos hooks customizados a menos que estritamente necessário.
- A persistência no backend deve garantir o encerramento seguro de blocos transacionais (commit/rollback).
