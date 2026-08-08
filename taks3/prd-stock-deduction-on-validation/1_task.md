---
status: completed
parallelizable: false
blocked_by: []
---

<task_context>
<domain>engine/infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
<unblocks>2.0</unblocks>
</task_context>

# Tarefa 1.0: Camada de Banco de Dados (Transações)

## Visão Geral
Implementar o modelo de dados (schema) e as lógicas de transação atômica (procedures ou queries no backend/db.ts) para garantir a consistência do estoque da barraca durante picos de uso.

## Requisitos
- Tabelas: `tickets`, `ticket_items`, `inventory`.
- Operação atômica para baixa de estoque e registro de ticket simultâneo.
- Tratamento explícito de concorrência e race conditions (saldo não pode ficar negativo).

## Subtarefas
- [ ] 1.1 Criar migrações/esquema das tabelas `tickets`, `ticket_items` e `inventory`.
- [ ] 1.2 Implementar método transacional no `db.ts` para validação (`validateTicket`).
- [ ] 1.3 Implementar método transacional no `db.ts` para estorno (`revertTicket`).
- [ ] 1.4 Adicionar restrições de banco de dados (`CHECK quantity >= 0`).

## Sequenciamento
- Bloqueado por: Nenhuma
- Desbloqueia: 2.0
- Paralelizável: Não

## Detalhes de Implementação
Consultar a seção de *Modelos de Dados* e *Análise de Impacto* da Especificação Técnica. A lógica de banco deve usar `FOR UPDATE` ou constraints para garantir atomicidade.

## Critérios de Sucesso
- Queries são capazes de executar commit com sucesso se o estoque >= quantidade pedida.
- Rollback imediato se o estoque for insuficiente, sem comprometer a atomicidade.
