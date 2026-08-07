---
status: completed
parallelizable: false
blocked_by: ["3.0"]
---

<task_context>
<domain>backend/websocket</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>"5.0", "6.0", "7.0"</unblocks>
</task_context>

# Tarefa 4.0: Adaptar `socket.ts` — `broadcastState()` Assincrono

## Visao Geral

Adaptar `backend/src/socket.ts` para que `broadcastState()` torne-se assíncrono e busque o estado diretamente do banco via `fetchPublicState()` em vez de usar `publicState()` (que lê do estado em memória, removido na Tarefa 3.0). Também adaptar o handler de conexão (`socket.on('connection')`) para ser assíncrono ao emitir o estado inicial.

## Requisitos

- Remover o import de `publicState` de `./db`
- Importar `fetchPublicState` de `./db`
- `broadcastState()` deve ser `async` e retornar `Promise<void>`
- Erros no `broadcastState()` devem ser capturados e logados via `console.error`, nunca propagados
- O handler de `connection` também deve chamar `fetchPublicState()` de forma assíncrona ao emitir o estado inicial
- Os chamadores de `broadcastState()` nas rotas NÃO precisam fazer `await` — é fire-and-forget

## Subtarefas

- [ ] 4.1 Atualizar o import: substituir `publicState` por `fetchPublicState`
- [ ] 4.2 Tornar `broadcastState()` assíncrono com `async/await`
- [ ] 4.3 Envolver o corpo de `broadcastState()` em try/catch
- [ ] 4.4 Atualizar o handler de `connection` para usar `await fetchPublicState()`
- [ ] 4.5 Testar: conectar um cliente WebSocket e verificar que recebe `state:update` com dados do banco

## Sequenciamento

- Bloqueado por: 3.0 (depende de `fetchPublicState()` estar disponível em `db.ts`)
- Desbloqueia: As tarefas 5.0, 6.0, 7.0 podem começar — elas precisam chamar `broadcastState()`
- Paralelizavel: Nao (depende de 3.0)

## Detalhes de Implementacao

```typescript
// backend/src/socket.ts — versão final
import { Server } from 'socket.io';
import http from 'http';
import { fetchPublicState } from './db';  // ← mudou de publicState para fetchPublicState

let io: Server | null = null;

export function initSocket(httpServer: http.Server, corsOrigins: string[]): Server {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true }
  });

  io.on('connection', async (socket) => {  // ← async adicionado
    try {
      const state = await fetchPublicState();
      socket.emit('state:update', state);
    } catch (err) {
      console.error('[socket] Falha ao emitir estado inicial:', err);
    }

    socket.on('disconnect', () => {});
  });

  return io;
}

// Chamado depois de toda mutação para avisar todos os clientes conectados
export async function broadcastState(): Promise<void> {  // ← async adicionado
  if (!io) return;
  try {
    const state = await fetchPublicState();
    io.emit('state:update', state);
  } catch (err) {
    console.error('[broadcastState] Falha ao buscar estado do banco:', err);
    // Silencia — clientes se recuperam via reconexao WebSocket ou GET /api/state
  }
}
```

**Nota importante:** os chamadores de `broadcastState()` nas rotas chamam assim:
```typescript
// Correto — fire-and-forget, nao bloqueia a resposta HTTP
broadcastState();  // sem await
res.json({ ticket: newTicket });
```

## Criterios de Sucesso

- `socket.ts` compila sem erros TypeScript
- Ao conectar um cliente WebSocket, ele recebe `state:update` com dados do banco (não do estado em memória)
- `broadcastState()` não lança exceção quando o banco está indisponível
- Log `[broadcastState] Falha ao buscar estado do banco:` aparece no console quando o banco cai
- Nenhuma referência a `publicState` ou `state` (memória) restante no arquivo
