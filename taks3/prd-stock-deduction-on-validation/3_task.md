---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>frontend/stall</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>medium</complexity>
<dependencies>websocket, http_server</dependencies>
<unblocks>5.0</unblocks>
</task_context>

# Tarefa 3.0: Frontend Data Layer & State Management

## Visão Geral
Gerenciar a camada de dados no frontend da barraca (React), incluindo conexão ao WebSocket para recebimento de atualizações de estoque e gerenciamento do estado local (carrinho/itens selecionados).

## Requisitos
- Manter o estado `selectedItems` local.
- Conectar ao backend via Socket.io/WebSocket e escutar eventos do channel da barraca.
- Derivar cálculos como valor total e validação de bloqueio caso um item do carrinho perca o estoque repentinamente pelo socket.

## Subtarefas
- [ ] 3.1 Configurar custom hook React (ex: `useStallInventory`) para assinar canal WebSocket.
- [ ] 3.2 Criar contexto/estado local para itens selecionados, calculando total e contagem dinamicamente.
- [ ] 3.3 Adicionar lógica de mock inicial para desenvolver isolado da API se necessário.
- [ ] 3.4 Implementar função de despacho (`handleSubmitTicket`) que chama a API e lida com timeout de 3s.

## Sequenciamento
- Bloqueado por: 2.0 (Depende dos contratos de API/Socket).
- Desbloqueia: 5.0
- Paralelizável: Sim (pode rodar em paralelo com a Tarefa 4.0).

## Detalhes de Implementação
Consultar a seção "Gerenciamento de Estado (Frontend)" no PRD Frontend. Atenção à prevenção de cliques duplos (estado "Carregando" na promisse do botão).

## Critérios de Sucesso
- Estado reativo com zero lag visual durante a seleção de itens.
- Atualização em tempo real correta quando chega evento do Socket.
