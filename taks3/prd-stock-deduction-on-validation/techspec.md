# Especificação Técnica: Validação de Tickets

## Resumo Executivo

O módulo de Validação de Tickets permitirá aos operadores da barraca confirmar entregas de produtos de forma digital, rápida (< 500ms de latência) e segura. A solução envolverá o Frontend (App da Barraca) para uma experiência de seleção ágil e o Backend para transações atômicas de inventário. Para suportar a atualização em tempo real do estoque (prevenção de concorrência e race conditions) e do feed, utilizaremos a conexão via WebSockets já existente na arquitetura do projeto.

## Arquitetura do Sistema

### Visão Geral dos Componentes

- **Stall Frontend (`frontend/src/stall`)**: Aplicação React otimizada para touch. Gerencia o estado local do ticket em montagem (itens selecionados, valor total) e impede submissões se o estoque local lido for zero.
- **Ticket API (`backend/src/routes/tickets`)**: Endpoints RESTful para processamento atômico das validações e cancelamentos (estornos).
- **Socket Manager (`backend/src/socket.ts`)**: Transmite eventos de `INVENTORY_UPDATED` e `TICKET_VALIDATED` para todos os clientes conectados da mesma barraca, mantendo a consistência do *Monitor de Estoque* em tempo real.
- **Database Module (`backend/src/db.ts`)**: Gerencia a lógica transacional rígida. Uma transação englobará a redução de estoque e a gravação do registro do ticket.

## Design de Implementação

### Interfaces Principais

```typescript
// Contratos de API
interface TicketValidationRequest {
  stallId: string;
  operatorId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface TicketValidationResponse {
  ticketId: string;
  success: boolean;
  status: 'VALIDATED' | 'FAILED_OUT_OF_STOCK';
  timestamp: string;
}

interface TicketRevertRequest {
  ticketId: string;
  operatorId: string;
}
```

### Modelos de Dados

- **`tickets`**: `id` (UUID), `status` (VALIDATED, REVERTED), `operator_id`, `stall_id`, `total_value`, `created_at`.
- **`ticket_items`**: `id`, `ticket_id`, `product_id`, `quantity`, `unit_price`.
- **`inventory`**: `stall_id`, `product_id`, `current_quantity`, `updated_at`.

### Endpoints de API

- `POST /api/tickets/validate`
  - **Descrição**: Processa a transação atômica de entrega.
  - **Lógica Interna**: Inicia transação SQL -> Verifica saldo de todos os itens com `FOR UPDATE` -> Se houver saldo, reduz estoque -> Insere em `tickets` e `ticket_items` -> Registra em `audit.ts` -> Commita.
- `POST /api/tickets/:id/revert`
  - **Descrição**: Desfaz uma validação (Estorno). Devolve a quantidade ao inventário e altera o status do ticket.
- `GET /api/inventory/stall/:stallId`
  - **Descrição**: Retorna o snapshot inicial do estoque para o Frontend (que após isso é mantido via Socket).

## Pontos de Integração

- **WebSockets**: Após um commit com sucesso em `/validate` ou `/revert`, o backend emite eventos `stock_changed` e `recent_ticket_added` no channel/room do `stallId` específico.
- **Módulo de Auditoria (`audit.ts`)**: Toda operação deve invocar a auditoria para salvar quem validou, quando e o IP/Device.

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Nível de Risco | Ação Requerida |
| --- | --- | --- | --- |
| BD `inventory` | Transacional / Carga | Alta concorrência de `UPDATE` na mesma linha de produto durante picos. Risco de deadlocks. | Usar restrição `CHECK (quantity >= 0)` e ordenação consistente de locks. |
| API `socket.ts` | Tráfego de Eventos | Broadcasts frequentes para clientes (1000 tickets/hora = ~16 requisições/min). Risco Baixo. | Fazer broadcast apenas para a "room" da barraca respectiva, não global. |
| UI Frontend | Renderização | Múltiplas atualizações de estado do array de inventário. Risco Baixo. | Usar memoization (`React.memo`) nos *ProductSelectors*. |

## Abordagem de Testes

### Testes Unitários
- **Backend / Transação**: Mock do banco de dados para forçar uma tentativa de validação de 5 itens quando só restam 3. Deve retornar erro e não abater nada (atomicidade).
- **Frontend / Componentes**: Teste no `ProductSelector` para garantir que o incremento além do estoque bloqueia o botão (+), garantindo que o estado reflita o valor real.

### Testes de Integração
- **Race Condition (Concorrência)**: Disparar 5 requisições de `POST /api/tickets/validate` simultâneas para a compra do último 1 item disponível. Garantir que apenas 1 retorna `200 OK` e 4 retornam falha.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Camada de Banco de Dados**: Criação do esquema e procedures/queries transacionais de baixa de estoque e estorno (`db.ts`).
2. **Backend API e Sockets**: Implementação dos endpoints e broadcast de eventos. Integração com o `audit.ts`.
3. **Frontend Data Layer**: Hooks React para gerenciamento do WebSocket local e chamadas de API (mock inicial se necessário).
4. **Frontend UI**: Construção do `ProductSelector`, Grid, botões flutuantes e painel inferior (`InventoryMonitor`, `RecentTicketsFeed`).
5. **Testes e Tuning**: Teste de carga (1.000 req/h) e verificação do tempo de resposta < 500ms.

### Dependências Técnicas
- As tabelas e módulos base (`db.ts` e estrutura base no app `frontend/src/stall`) já existem e devem ser importados sem refatoração excessiva.

## Monitoramento e Observabilidade

- **Métricas Chave**: 
  - Tempo de resposta do endpoint `/api/tickets/validate` (alvo p95 < 300ms).
  - Taxa de falhas por "Out of Stock".
- **Logs**: Injetar logs precisos no `backend` durante falhas de transação ou rollback.

## Considerações Técnicas

### Decisões Principais
- **Validação Otimista no Cliente vs. Pessimista no Servidor**: O frontend impedirá o clique se o estado *local* do Socket disser que está sem estoque (Melhor UX). Porém, a verdadeira proteção contra concorrência ocorrerá no Banco (Lock/Pessimista), pois o frontend pode estar milissegundos atrasado.
- **Totalização do Valor**: A soma de `price * count` ocorrerá puramente para feedback visual no frontend. O backend gravará o valor no ticket como histórico, mas não processará a cobrança.

### Riscos Conhecidos
- Picos de uso intermitentes podem causar falhas de rede na tenda.
- **Mitigação**: Adicionar timeout curto (3s) na requisição de validação. Se der timeout, o frontend entra em estado de "Carregando" em vez de falhar silenciosamente, para evitar duplo clique (validação dupla acidental).

### Conformidade com Padrões
- Segue a divisão atual de `/backend/src/routes` e `/frontend/src/stall`.
- Implementa rastreio completo no `audit.ts`.
