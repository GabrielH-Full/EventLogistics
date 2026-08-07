---
status: completed
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/core</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
<unblocks>"4.0", "5.0", "6.0", "7.0", "8.0"</unblocks>
</task_context>

# Tarefa 3.0: Reescrever `db.ts` — Remover Estado em Memória

## Visao Geral

Reescrever completamente `backend/src/db.ts`. O objetivo é eliminar as funções `load()`, `persist()`, `save()`, a variável `state: AppState` e toda dependência do arquivo `data.json`. Após esta tarefa, `db.ts` exportará apenas `db` (o `Pool` do Postgres) e a nova função assíncrona `fetchPublicState()` que consulta o banco diretamente.

Esta é a tarefa de maior impacto na arquitetura — após ela, o servidor não terá mais estado local.

## Requisitos

- Remover imports de `fs`, `path` e `./seedData`
- Remover as funções: `load()`, `persist()`, `save()`
- Remover a variável exportada `state: AppState`
- Remover a função `publicState()` (síncrona)
- Adicionar a interface `PublicState`
- Adicionar a função `fetchPublicState(): Promise<PublicState>` (assíncrona)
- Manter o export `db` (instância do `Pool`)
- O servidor deve continuar iniciando sem erros após esta alteração

## Subtarefas

- [ ] 3.1 Remover imports de `fs`, `path`, `buildInitialState`, `AppState`
- [ ] 3.2 Remover as funções `load()`, `persist()`, `save()`
- [ ] 3.3 Remover o export `state` e `publicState()`
- [ ] 3.4 Adicionar interface `PublicState` com `products`, `stalls`, `tickets`
- [ ] 3.5 Implementar `fetchPublicState()` com `Promise.all` de 3 queries
- [ ] 3.6 Compilar o projeto (`npx tsc --noEmit`) e corrigir todos os erros de compilação causados pelos exports removidos
- [ ] 3.7 Verificar que `npm start` sobe sem erros

## Sequenciamento

- Bloqueado por: 1.0 (migration deve estar aplicada antes de testar `fetchPublicState()`)
- Desbloqueia: 4.0, 5.0, 6.0, 7.0, 8.0
- Paralelizavel: Nao (é o núcleo da migração, tudo depende dele)

## Detalhes de Implementacao

```typescript
// backend/src/db.ts — versão final após refatoração
import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgres://eventlogistics:eventlogistics_secret@localhost:5433/eventlogistics_db'
});

export interface PublicState {
  products: Record<string, unknown>[];
  stalls:   Record<string, unknown>[];
  tickets:  Record<string, unknown>[];
}

export async function fetchPublicState(): Promise<PublicState> {
  const [products, stalls, tickets] = await Promise.all([
    db.query('SELECT * FROM products WHERE is_active = true ORDER BY name'),
    db.query('SELECT * FROM stalls   WHERE is_active = true ORDER BY name'),
    db.query('SELECT * FROM tickets  ORDER BY created_at DESC LIMIT 100'),
  ]);
  return {
    products: products.rows,
    stalls:   stalls.rows,
    tickets:  tickets.rows,
  };
}
```

**Erros de compilacao esperados apos remover os exports:**
Todos os arquivos que importam `{ state, save }` ou `{ publicState }` de `../db` vao gerar erro.
Isso é esperado — cada erro aponta uma rota que precisa ser refatorada nas tarefas 5.0, 6.0, 7.0, 8.0.

## Criterios de Sucesso

- `db.ts` não importa `fs`, `path` nem `seedData`
- `db.ts` não exporta `state`, `save`, `load`, `publicState`
- `fetchPublicState()` retorna `{ products, stalls, tickets }` com dados do banco
- `npm start` sobe sem erros (após as demais rotas também serem corrigidas)
- `npx tsc --noEmit` mostra zero erros (após todas as tarefas de rotas concluídas)
