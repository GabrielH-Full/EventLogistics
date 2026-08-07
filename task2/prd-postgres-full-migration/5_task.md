---
status: completed
parallelizable: true
blocked_by: ["3.0", "4.0"]
---

<task_context>
<domain>backend/routes</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 5.0: Refatorar `stateRoutes.ts` — GET /api/state via Banco

## Visao Geral

Atualizar `backend/src/routes/stateRoutes.ts` para que o endpoint `GET /api/state` passe a buscar dados diretamente do banco via `fetchPublicState()`, em vez de retornar o estado em memória via `publicState()`. É a refatoração mais simples dentre as rotas — apenas um handler precisa virar assíncrono.

## Requisitos

- Remover o `require('../db')` legado (que usa CommonJS) e substituir por import ESM de `fetchPublicState`
- O handler do `GET /` deve ser `async`
- Retornar o resultado de `await fetchPublicState()` como JSON
- Manter o middleware `requireAuth` existente
- O contrato de resposta da API não deve mudar (os campos `products`, `stalls`, `tickets` devem continuar presentes)

## Subtarefas

- [ ] 5.1 Substituir `const { publicState } = require('../db')` por `import { fetchPublicState } from '../db'`
- [ ] 5.2 Substituir `const { requireAuth } = require('../middleware')` por import ESM
- [ ] 5.3 Tornar o handler do `GET /` assíncrono (`async (req, res)`)
- [ ] 5.4 Substituir `res.json(publicState())` por `res.json(await fetchPublicState())`
- [ ] 5.5 Adicionar try/catch para retornar 500 em caso de erro de banco
- [ ] 5.6 Testar: `GET /api/state` retorna dados do banco após autenticação

## Sequenciamento

- Bloqueado por: 3.0 (fetchPublicState deve existir), 4.0 (broadcastState assíncrono)
- Desbloqueia: 9.0 (testes finais)
- Paralelizavel: Sim (com 6.0 e 7.0, após 3.0 estar concluída)

## Detalhes de Implementacao

```typescript
// backend/src/routes/stateRoutes.ts — versão final
import { Router, Request, Response } from 'express';
import { fetchPublicState } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

// GET /api/state — snapshot atual usado no carregamento inicial da tela.
// As atualizacoes seguintes chegam via WebSocket (state:update).
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const state = await fetchPublicState();
    res.json(state);
  } catch (err) {
    console.error('Erro ao buscar estado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar estado.' });
  }
});

export default router;
```

## Criterios de Sucesso

- `stateRoutes.ts` não importa nada de `../db` exceto `fetchPublicState`
- `GET /api/state` (autenticado) retorna `{ products, stalls, tickets }` com dados do banco
- Criar um produto diretamente via SQL e verificar que aparece imediatamente no `GET /api/state`
- Nenhuma referência a `publicState` ou `state` (memória) no arquivo
- Arquivo compila sem erros TypeScript
