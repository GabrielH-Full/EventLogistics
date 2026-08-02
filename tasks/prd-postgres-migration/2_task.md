---
status: completed
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/database/client</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database|docker|http_server</dependencies>
<unblocks>none</unblocks>
</task_context>

# Tarefa 2.0: Implementação da Camada de Banco de Dados Assíncrona no Backend (`pg` Pool)

## Visao Geral

Esta tarefa conecta o backend Node.js + Express + TypeScript ao banco de dados PostgreSQL executando no Docker Compose.
Ela atualiza a camada de persistência em `backend/src/db.ts` utilizando o driver nativo `pg` (`Pool`), substituindo a manipulação síncrona de arquivo JSON (`data.json`) por operações de banco relacionais assíncronas duráveis.

## Requisitos

- Configurar o pool de conexões com o PostgreSQL usando `pg` em `backend/src/db.ts`.
- Carregar configurações de conexão do `.env` (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
- Implementar consultas assíncronas SQL com suporte a transações (`BEGIN`, `COMMIT`, `ROLLBACK`) para operações críticas como baixa de estoque em vendas de tickets.
- Garantir que todas as rotas Express continuem funcionando sem quebras de contrato ou alteração no payload.
- Manter o suporte a notificações em tempo real enviando `publicState()` atualizado após mutações.

## Subtarefas

- [ ] 2.1 Instalar o pacote `pg` e os tipos `@types/pg` no `backend/package.json`.
- [ ] 2.2 Atualizar o arquivo `.env.example` no backend com as variáveis do PostgreSQL.
- [ ] 2.3 Refatorar `backend/src/db.ts` para criar e exportar o Pool de conexões do `pg`.
- [ ] 2.4 Implementar função assíncrona `getPublicState()` para carregar produtos, barracas e tickets formatados a partir das tabelas SQL.
- [ ] 2.5 Atualizar a rota de criação de tickets (`backend/src/routes/ticketRoutes.js`) para usar transação SQL com verificação de estoque e `409 Conflict`.
- [ ] 2.6 Executar build e testes do backend para garantir conformidade.

## Sequenciamento

- Bloqueado por: 1.0 (Container Docker e Esquema PostgreSQL criados)
- Desbloqueia: Nenhum (Conclusão da migração do PRD)
- Paralelizavel: Nao

## Detalhes de Implementacao

```typescript
// Exemplo de integração do pg Pool em backend/src/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'eventlogistics',
  password: process.env.PGPASSWORD || 'eventlogistics_secret',
  database: process.env.PGDATABASE || 'eventlogistics_db',
  max: 20,
  idleTimeoutMillis: 30000,
});
```

## Criterios de Sucesso

- O backend se conecta com sucesso ao container do PostgreSQL sem erros de autenticação ou SSL.
- As operações de leitura (`GET /api/state`) e escrita (`POST /api/tickets`) persistem dados diretamente no PostgreSQL.
- Falhas de estoque disparam rollback na transação SQL e retornam status `409 Conflict`.
- `npm run build` do backend compila sem erros de TypeScript.
