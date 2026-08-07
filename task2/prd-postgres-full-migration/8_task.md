---
status: completed
parallelizable: true
blocked_by: ["3.0", "2.0"]
---

<task_context>
<domain>backend/routes</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 8.0: Limpar Rotas Admin — Remover `syncStateProducts()` e `save()` Residuais

## Visao Geral

As rotas `adminProductRoutes.ts` e `adminStallRoutes.ts` já usam `db.query()` para as operações principais, mas ainda chamam `syncStateProducts()` e `save()` depois de cada mutação — funções que serão removidas na Tarefa 3.0. Esta tarefa remove essas chamadas órfãs e adiciona as chamadas a `logAudit()` que ainda faltam nessas rotas.

## Requisitos

- `adminProductRoutes.ts`: remover a função `syncStateProducts()` inteira e todas as suas chamadas
- `adminProductRoutes.ts`: remover o import de `{ state, save }` de `../db`
- `adminStallRoutes.ts`: remover chamadas a `save()` e imports de `state`
- Adicionar `logAudit()` nas mutações que ainda não têm auditoria
- `broadcastState()` já existe nas rotas — verificar que ainda é chamado após cada mutação

## Subtarefas

- [ ] 8.1 Em `adminProductRoutes.ts`:
  - [ ] 8.1.1 Remover a função `syncStateProducts()` (linhas 14-52 aproximadamente)
  - [ ] 8.1.2 Remover o import de `{ db, state, save }` — manter apenas `{ db }`
  - [ ] 8.1.3 Em cada rota que chamava `syncStateProducts()`, garantir que `broadcastState()` ainda é chamado
  - [ ] 8.1.4 Adicionar `logAudit()` em: POST (PRODUCT_CREATED), PUT (PRODUCT_UPDATED), PATCH/status (PRODUCT_UPDATED), DELETE (PRODUCT_DELETED)
- [ ] 8.2 Em `adminStallRoutes.ts`:
  - [ ] 8.2.1 Remover import de `save` de `../db`
  - [ ] 8.2.2 Remover chamadas a `save()`
  - [ ] 8.2.3 Adicionar `logAudit()` em: POST (STALL_CREATED), PUT (STALL_UPDATED), PATCH/status (STALL_UPDATED)
- [ ] 8.3 Compilar e verificar zero erros TypeScript nos dois arquivos
- [ ] 8.4 Testar CRUD de produtos e barracas via interface admin

## Sequenciamento

- Bloqueado por: 3.0 (remove os exports que precisamos eliminar), 2.0 (audit.ts para logAudit)
- Desbloqueia: 9.0
- Paralelizavel: Sim (com 5.0, 6.0, 7.0 — são arquivos diferentes)

## Detalhes de Implementacao

**Em `adminProductRoutes.ts`, substituir:**
```typescript
// ANTES (remover):
const syncStateProducts = async () => {
  // ... 40 linhas de código sincronizando state em memória ...
  save();
  broadcastState();
};

// Após cada mutação:
await syncStateProducts();

// DEPOIS (manter apenas):
broadcastState();  // ja existia, continua
logAudit({ ... }); // adicionar
```

**Adicionar import de logAudit em ambos os arquivos:**
```typescript
import { logAudit } from '../audit';
```

**Exemplo de logAudit em adminProductRoutes POST:**
```typescript
// Após o INSERT bem-sucedido:
logAudit({
  userId: req.user!.sub,
  action: 'PRODUCT_CREATED',
  entityType: 'products',
  entityId: product_id,
  before: null,
  after: insertResult.rows[0],
});
```

## Criterios de Sucesso

- `adminProductRoutes.ts` não exporta nem chama `syncStateProducts()`
- `adminProductRoutes.ts` não importa `state` ou `save` de `../db`
- `adminStallRoutes.ts` não importa nem chama `save` de `../db`
- Todas as mutações admin (produto e barraca) geram registro em `audit_logs`
- CRUD de produtos via interface admin continua funcionando
- `broadcastState()` ainda é chamado após cada mutação
- Ambos os arquivos compilam sem erros TypeScript
