import { Server } from 'socket.io';
import http from 'http';
import { fetchPublicState } from './db';

let io: Server | null = null;

export function initSocket(httpServer: http.Server, corsOrigins: string[]): Server {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true }
  });

  io.on('connection', async (socket) => {
    const stallId = socket.handshake.query.stallId;
    if (stallId) {
      socket.join(`stall_${stallId}`);
    }

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

export function broadcastToStall(stallId: string, event: string, data: any): void {
  if (!io) return;
  io.to(`stall_${stallId}`).emit(event, data);
}

// Chamado depois de toda mutação para avisar todos os clientes conectados
export async function broadcastState(): Promise<void> {
  if (!io) return;
  try {
    const state = await fetchPublicState();
    io.emit('state:update', state);
  } catch (err) {
    console.error('[broadcastState] Falha ao buscar estado do banco:', err);
    // Silencia — clientes se recuperam via reconexao WebSocket ou GET /api/state
  }
}