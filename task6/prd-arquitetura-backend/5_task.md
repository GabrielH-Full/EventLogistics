---
status: pending
parallelizable: true
blocked_by: ["3.0", "4.0"]
---

<task_context>
<domain>engine/testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>testing_framework</dependencies>
<unblocks>[]</unblocks>
</task_context>

# Tarefa 5.0: Criação da Suíte de Testes Unitários dos Services

## Visão Geral

Desenvolver a suíte de testes unitários automatizados para a camada de Services. Como os Services dependem de interfaces/classes de repositório e callbacks de auditoria/broadcast, os testes devem utilizar mocks puros em memória, executando em milissegundos sem necessidade de conexão com banco de dados PostgreSQL.

## Requisitos

- Configurar ambiente de testes unitários (`vitest` ou `jest`).
- Criar testes unitários para `TicketService` cobrindo cenários de sucesso, erro de estoque insuficiente, permissão de barraca e estorno.
- Criar testes unitários para `InventoryService` cobrindo adição de produção, respeito ao teto `max_stock` e reset de barraca.
- Criar testes unitários para `UserService` validando hash de senha e fluxo de criação/atualização.

## Subtarefas

- [ ] 5.1 Configurar runner de testes no projeto (`package.json` / `vitest.config.ts`).
- [ ] 5.2 Implementar testes de `TicketService` (`tests/unit/TicketService.spec.ts`).
- [ ] 5.3 Implementar testes de `InventoryService` (`tests/unit/InventoryService.spec.ts`).
- [ ] 5.4 Implementar testes de `UserService` (`tests/unit/UserService.spec.ts`).
- [ ] 5.5 Executar suíte completa e assegurar 100% de aprovação nos testes.

## Sequenciamento

- Bloqueado por: 3.0, 4.0
- Desbloqueia: Nenhuma (etapa final de garantia de qualidade)
- Paralelizável: Sim

## Detalhes de Implementação

- Mockar `TicketRepository`, `ProductRepository`, `UserRepository`, `StallRepository`.
- Mockar `logAudit` e `broadcastState` via funções spy / mock (`vi.fn()` ou `jest.fn()`).
- Simular transações com stub de `PoolClient` validando emissão de `BEGIN`, `COMMIT` e `ROLLBACK`.

## Critérios de Sucesso

- Suíte de testes executa de forma rápida e determinística sem infraestrutura externa.
- Cobertura dos fluxos e regras críticas de negócio do sistema.\n