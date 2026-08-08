---
status: completed
parallelizable: false
blocked_by: ["3.0", "4.0"]
---

<task_context>
<domain>engine/testing</domain>
<type>testing</type>
<scope>performance</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>None</unblocks>
</task_context>

# Tarefa 5.0: Integração e Testes de Concorrência

## Visão Geral
Garantir que a solução ponta a ponta flua corretamente, além de atestar que a API da barraca consegue suportar o volume de pico projetado (1.000 validações por hora) sem corromper o estoque.

## Requisitos
- Testes E2E (Front -> Back -> DB -> Front via Socket).
- Testes de concorrência massiva para garantir atomidade.

## Subtarefas
- [ ] 5.1 Criar e executar teste E2E validando o fluxo comum e o fluxo de estorno pelo UI.
- [ ] 5.2 Realizar script/teste de carga disparando 10-20 requisições simultâneas focadas no mesmo produto para garantir que o BD previne valores negativos (deadlock ou rollback gracioso).
- [ ] 5.3 Simular o timeout no frontend (3s) e atestar a experiência do operador (loading).

## Sequenciamento
- Bloqueado por: 3.0, 4.0
- Desbloqueia: Lançamento Final
- Paralelizável: Não

## Detalhes de Implementação
Referência à seção de "Abordagem de Testes" na Tech Spec.

## Critérios de Sucesso
- Nenhum registro no DB permitiu estoque negativo durante os testes de carga.
- A latência p95 se mantém inferior a 300ms nos cenários isolados.
