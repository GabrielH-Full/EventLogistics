---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
<unblocks>"3.0", "9.0"</unblocks>
</task_context>

# Tarefa 1.0: Criar Migration `003_audit_logs.sql`

## Visao Geral

Criar a migration SQL que adiciona a tabela `audit_logs` ao banco de dados PostgreSQL. Esta é a fundação para o sistema de rastreabilidade de alterações. A migration é idempotente (`CREATE TABLE IF NOT EXISTS`) e pode ser aplicada sem downtime pois não altera tabelas existentes.

## Requisitos

- A migration deve usar `CREATE TABLE IF NOT EXISTS` para ser idempotente
- A tabela deve ser criada com todos os campos definidos no PRD: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `changes`, `created_at`
- Criar os 3 índices definidos: `idx_audit_logs_entity`, `idx_audit_logs_user`, `idx_audit_logs_created`
- O campo `entity_id` deve ser `TEXT` (não UUID) para suportar IDs de tipos variados
- O campo `changes` deve ser `JSONB` para armazenar `{ before: {...}, after: {...} }`
- Nomear o arquivo como `003_audit_logs.sql` na pasta `backend/migrations/`

## Subtarefas

- [ ] 1.1 Criar o arquivo `backend/migrations/003_audit_logs.sql`
- [ ] 1.2 Escrever o DDL da tabela `audit_logs` com todos os campos
- [ ] 1.3 Adicionar os 3 índices de performance
- [ ] 1.4 Aplicar a migration no banco local: `docker exec -i <container> psql -U eventlogistics -d eventlogistics_db < backend/migrations/003_audit_logs.sql`
- [ ] 1.5 Verificar que a tabela foi criada: `SELECT table_name FROM information_schema.tables WHERE table_name = 'audit_logs'`

## Sequenciamento

- Bloqueado por: Nenhum
- Desbloqueia: 3.0, 9.0
- Paralelizavel: Sim (independente de qualquer outro arquivo TypeScript)

## Detalhes de Implementacao

```sql
-- backend/migrations/003_audit_logs.sql

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT      REFERENCES users(user_id) ON DELETE SET NULL,
  action      VARCHAR(60) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   TEXT        NOT NULL,
  changes     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity  ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
```

## Criterios de Sucesso

- Arquivo `backend/migrations/003_audit_logs.sql` existe e é válido SQL
- Migration aplicada sem erros no banco local
- Tabela `audit_logs` aparece no `\dt` do psql
- Rodar a migration uma segunda vez não gera erro (idempotência confirmada)
- Os 3 índices são visíveis via `\di audit_logs*`
