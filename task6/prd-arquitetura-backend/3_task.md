---
status: completed
parallelizable: false
blocked_by: ["1.0", "2.0"]
---

<task_context>
<domain>engine/domain_services</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database|http_server</dependencies>
<unblocks>["4.0", "5.0"]</unblocks>
</task_context>

# Tarefa 3.0: Implementação da Camada de Services (Regras de Negócio e Transações)

## Visão Geral

Construir a camada de domínio responsável pela orquestração dos casos de uso, controle de transações (Unit of Work via `PoolClient`), verificações de permissão/ownership de barracas, registro de auditoria e disparo de atualizações WebSocket.

## Requisitos

- Implementar `TicketService` (criação de venda com débito atômico de estoque, validação de ticket com checagem de barraca, reversão com estorno).
- Implementar `InventoryService` (adição de produção com teto `max_stock`, reset de estoque de barraca, centralização de ownership `product.stall_id === user.stallId`).
- Implementar `UserService` (criação de usuário com hash bcrypt, sincronização de barracas, listagem com paginação e exclusão).
- Implementar `ProductService`, `StallService` e `CategoryService` para operações de administração e regras como bloqueio de exclusão de produto com vendas.
- Injetar dependências explicitamente via construtor.

## Subtarefas

- [x] 3.1 Implementar `src/services/TicketService.ts` com controle transacional (BEGIN/COMMIT/ROLLBACK) e disparo de `logAudit` + `broadcastState`.
- [x] 3.2 Implementar `src/services/InventoryService.ts` com checagem unificada de ownership.
- [x] 3.3 Implementar `src/services/UserService.ts` encapsulando `bcryptjs` e transações de vinculação de barracas.
- [x] 3.4 Implementar `src/services/ProductService.ts`, `src/services/StallService.ts` e `src/services/CategoryService.ts`.
- [x] 3.5 Garantir que `client.release()` seja sempre executado em blocos `finally` nas transações.

## Sequenciamento

- Bloqueado por: 1.0, 2.0
- Desbloqueia: 4.0, 5.0
- Paralelizável: Não (coordena o domínio central da aplicação)

## Detalhes de Implementação

```typescript
// Padrão Unit of Work no TicketService
const client = await this.pool.connect();
try {
  await client.query('BEGIN');
  // orquestração com ticketRepo e productRepo passando client...
  await client.query('COMMIT');
  await this.auditLogger({ ... });
  await this.broadcast();
  return result;
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

## Critérios de Sucesso

- Todas as regras de negócio migradas para os Services.
- Nenhuma dependência de objetos HTTP (`Request`, `Response`, `express`) dentro de `src/services/`.
- Transações protegidas com tratamento robusto de erros e liberação garantida de conexões.\n