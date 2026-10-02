---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>engine/persistence</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
<unblocks>["3.0"]</unblocks>
</task_context>

# Tarefa 2.0: Implementação da Camada de Repositórios e Limpeza de db.ts

## Visão Geral

Extrair todas as consultas e comandos SQL embutidos nas rotas e no `db.ts` para quatro classes de repositório dedicadas (`TicketRepository`, `ProductRepository`, `StallRepository`, `UserRepository`). Remover regras de negócio de `db.ts`, mantendo-o estritamente como provedor do `Pool` e `fetchPublicState()`.

## Requisitos

- Implementar `src/repositories/TicketRepository.ts` para operações em `tickets` e `ticket_items`.
- Implementar `src/repositories/ProductRepository.ts` para operações em `products`.
- Implementar `src/repositories/StallRepository.ts` para operações em `stalls` e `stall_users`.
- Implementar `src/repositories/UserRepository.ts` para operações em `users` e `stall_users`.
- Suportar recebimento opcional de `PoolClient` para métodos que participam de transações (`findByIdForUpdate`, `createWithItems`, `decrementStock`, etc.).
- Limpar `src/db.ts` removendo `validateTicket()` e `revertTicket()`.

## Subtarefas

- [x] 2.1 Criar `src/repositories/ProductRepository.ts` com métodos de busca, locks, decremento, incremento e CRUD.
- [x] 2.2 Criar `src/repositories/TicketRepository.ts` com métodos de inserção composta, atualização de status e validações de itens.
- [x] 2.3 Criar `src/repositories/StallRepository.ts` e `src/repositories/UserRepository.ts` com métodos de CRUD e sync N:M.
- [x] 2.4 Refatorar `src/db.ts` removendo funções de negócio e mantendo `pool` e `fetchPublicState()`.
- [x] 2.5 Verificar consultas SQL quanto a parametrização segura (`$1, $2`).

## Sequenciamento

- Bloqueado por: 1.0
- Desbloqueia: 3.0
- Paralelizável: Sim (cada repositório pode ser implementado de forma independente após 1.0)

## Detalhes de Implementação

- Repositórios devem receber a instância de `Pool` no construtor.
- Métodos transacionais devem receber `client: PoolClient` como primeiro argumento.
- Nenhum repositório deve importar `socket.ts`, `audit.ts` ou `express`.

## Critérios de Sucesso

- 100% das consultas SQL do sistema mapeadas e encapsuladas nos repositórios.
- `db.ts` livre de regras de negócio.
- Zero quebras de compilação nos arquivos auxiliares.\n