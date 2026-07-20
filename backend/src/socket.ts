import { Server } from 'socket.io';
import http from 'http';
import { publicState } from './db';

let io: Server | null = null;

export function initSocket(httpServer: http.Server, corsOrigins: string[]): Server {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true }
  });

  io.on('connection', socket => {
    // Ao conectar, o cliente já recebe o estado atual, então caixa e
    // barraca nunca ficam desatualizados mesmo se o socket demorar a conectar.
    socket.emit('state:update', publicState());

    socket.on('disconnect', () => {});
  });

  return io;
}

// Chamado depois de toda mutação (venda, produção, validação) para
// avisar todo mundo conectado (caixa central + todas as barracas) na hora.
export function broadcastState(): void {
  if (io) {
    io.emit('state:update', publicState());
  }
}