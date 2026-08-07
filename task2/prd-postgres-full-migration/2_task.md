---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>backend/infra</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
<unblocks>"7.0", "6.0", "5.0", "8.0"</unblocks>
</task_context>

# Tarefa 2.0: Criar Helper de Auditoria `audit.ts`

## Visao Geral

Criar o arquivo `backend/src/audit.ts` com a função `logAudit()` — um helper centralizado e fire-and-forget para inserir registros na tabela `audit_logs`. Esta função nunca lança exceções para o chamador, garantindo que falhas de auditoria não afetem as operações principais do sistema.

## Requisitos

- Criar o arquivo `backend/src/audit.ts`
- A função `logAudit()` deve ser `async` e retornar `Promise<void>`
- Nunca lançar exceção — sempre capturar e logar via `console.error`
- Aceitar: `userId`, `action`, `entityType`, `entityId`, `before?`, `after?`
- O campo `changes` no banco deve ser JSONB com shape `{ before, after }`
- `userId` pode ser `null` (ex: operação de sistema sem usuário autenticado)

## Subtarefas

- [ ] 2.1 Criar `backend/src/audit.ts`
- [ ] 2.2 Definir a interface `AuditParams`
- [ ] 2.3 Implementar `logAudit()` com try/catch e console.error no catch
- [ ] 2.4 Testar manualmente: chamar `logAudit()` com dados válidos e verificar insert na tabela
- [ ] 2.5 Testar resiliência: forçar erro (ex: tabela inexistente) e confirmar que não lança exceção

## Sequenciamento

- Bloqueado por: Nenhum (pode ser criado antes mesmo da migration ser aplicada — o arquivo TS compila sem o banco)
- Desbloqueia: 5.0, 6.0, 7.0, 8.0 (todas as rotas que precisam chamar `logAudit`)
- Paralelizavel: Sim (com 1.0, 3.0)

## Detalhes de Implementacao

```typescript
// backend/src/audit.ts
import { db } from './db';

interface AuditParams {
  userId:     number | null;
  action:     string;          // ex: 'TICKET_CREATED'
  entityType: string;          // ex: 'tickets'
  entityId:   string;
  before?:    Record<string, unknown> | null;
  after?:     Record<string, unknown> | null;
}

// Fire-and-forget: nunca lanca excecao para o chamador
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.userId,
        params.action,
        params.entityType,
        params.entityId,
        JSON.stringify({ before: params.before ?? null, after: params.after ?? null }),
      ]
    );
  } catch (err) {
    console.error('[audit] Falha ao registrar audit_log:', err);
  }
}
```

**Convencao de `action` (usar sempre SCREAMING_SNAKE_CASE):**
- `TICKET_CREATED`, `TICKET_VALIDATED`
- `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `PRODUCT_STOCK_UPDATED`
- `STALL_CREATED`, `STALL_UPDATED`, `STALL_STOCK_RESET`
- `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`

## Criterios de Sucesso

- Arquivo `backend/src/audit.ts` compila sem erros TypeScript
- `logAudit()` insere registro correto na tabela `audit_logs` quando chamada
- `logAudit()` não lança exceção quando o banco está indisponível ou a tabela não existe
- O campo `changes` no banco contém JSON válido com shape `{ before, after }`
