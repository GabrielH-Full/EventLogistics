---
status: completed
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server, websocket</dependencies>
<unblocks>3.0, 4.0</unblocks>
</task_context>

# Tarefa 2.0: Backend API e Sockets

## Visão Geral
Construir os endpoints REST para validação de tickets e integrar os eventos via WebSockets para atualização do feed e estoque das barracas em tempo real.

## Requisitos
- Endpoints `POST /api/tickets/validate` e `POST /api/tickets/:id/revert`.
- Emissão de eventos `INVENTORY_UPDATED` e `TICKET_VALIDATED` apenas para a `room` específica da barraca.
- Integração obrigatória com o módulo de auditoria (`audit.ts`).

## Subtarefas
- [ ] 2.1 Criar endpoints REST `/validate` e `/revert` chamando a camada de DB (1.0).
- [ ] 2.2 Integrar o `socket.ts` aos endpoints para emitir eventos pós-commit.
- [ ] 2.3 Implementar chamadas para `audit.ts` documentando operador e horário.
- [ ] 2.4 Teste unitário isolado verificando recusa via erro 400 em caso de saldo < 0.

## Sequenciamento
- Bloqueado por: 1.0
- Desbloqueia: 3.0, 4.0
- Paralelizável: Não

## Detalhes de Implementação
Consultar seção de *Endpoints de API* na Tech Spec. A latência alvo é < 300ms. Evitar broadcast global no socket.

## Critérios de Sucesso
- Requisições REST finalizam e disparam eventos Socket em < 500ms.
- Ações registradas no `audit.ts`.
