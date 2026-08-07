---
status: completed
parallelizable: false
blocked_by: ["1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0"]
---

<task_context>
<domain>backend/testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>"10.0"</unblocks>
</task_context>

# Tarefa 9.0: Testes de Integração End-to-End

## Visao Geral

Executar e expandir os testes de integração que validam todos os fluxos críticos da migração com o banco de dados real rodando via Docker. O arquivo `backend/test-integration.ts` existente deve ser atualizado para cobrir os novos cenários — especialmente a atomicidade das transações e a auditoria.

## Requisitos

- Todos os fluxos críticos devem ser testados contra o banco real (não mocks)
- Testar: venda normal, venda com estoque insuficiente, venda concorrente, validação de ticket
- Testar: `GET /api/state` retorna dados do banco (não de memória)
- Testar: registro em `audit_logs` após cada mutação
- Testar: `broadcastState()` emite `state:update` via WebSocket
- Zero referências a `state`, `save()`, `publicState()` devem existir em qualquer `.ts` do backend após a migração

## Subtarefas

- [ ] 9.1 Verificar que o Docker está rodando: `docker-compose up -d`
- [ ] 9.2 Aplicar migration 003: `docker exec -i <container> psql ... < migrations/003_audit_logs.sql`
- [ ] 9.3 Testar `GET /api/state` — retorna dados do banco
- [ ] 9.4 Testar `POST /api/tickets` com estoque suficiente:
  - Verificar resposta 201 com ticket criado
  - Verificar `SELECT stock FROM products` decrementou no banco
  - Verificar `SELECT * FROM audit_logs WHERE action = 'TICKET_CREATED'` retorna 1 registro
- [ ] 9.5 Testar `POST /api/tickets` com estoque insuficiente — retorna 409, banco não modificado
- [ ] 9.6 Testar venda concorrente (2 requisições simultâneas, estoque = 1):
  ```typescript
  const [r1, r2] = await Promise.all([
    fetch('/api/tickets', { method: 'POST', body: JSON.stringify({ items: [{ productId, quantity: 1 }] }) }),
    fetch('/api/tickets', { method: 'POST', body: JSON.stringify({ items: [{ productId, quantity: 1 }] }) }),
  ]);
  // Esperado: 1 com status 201, 1 com status 409
  ```
- [ ] 9.7 Testar `POST /api/tickets/:id/validate` por operador correto — retorna 200
- [ ] 9.8 Testar `POST /api/tickets/:id/validate` por operador errado — retorna 403
- [ ] 9.9 Testar WebSocket: conectar cliente, fazer mutação, verificar `state:update` recebido
- [ ] 9.10 Verificar zero referências a `state` ou `save` nos arquivos `.ts`:
  ```bash
  grep -rn "from '../db'" backend/src/routes/ | grep -v "^Binary"
  # Nenhum resultado deve conter "state" ou "save"
  ```
- [ ] 9.11 Executar `npx tsc --noEmit` — zero erros de compilação

## Sequenciamento

- Bloqueado por: todas as tarefas anteriores (1.0 a 8.0)
- Desbloqueia: 10.0
- Paralelizavel: Nao (precisa de tudo implementado)

## Detalhes de Implementacao

**Verificar zero referências a state/save (PowerShell):**
```powershell
Select-String -Path "backend\src\**\*.ts" -Pattern "state\.|save\(\)" -Recurse
# Resultado esperado: nenhuma ocorrência
```

**Verificar zero referências a data.json:**
```powershell
Select-String -Path "backend\src\**\*.ts" -Pattern "data\.json" -Recurse
# Resultado esperado: nenhuma ocorrência
```

**Consulta SQL para verificar audit_logs após testes:**
```sql
SELECT action, entity_type, entity_id, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

## Criterios de Sucesso

- `npx tsc --noEmit` retorna zero erros
- Nenhum arquivo `.ts` em `backend/src/` referencia `state`, `save()`, `load()` ou `data.json`
- Todos os 8 cenários de teste (9.3 a 9.9) passam
- Venda concorrente com estoque 1: exatamente 1 sucesso e 1 falha
- `audit_logs` contém registros para cada operação executada nos testes
- `npm start` sobe o servidor sem nenhum warning ou erro relacionado ao `data.json`
