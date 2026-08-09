import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Em dev, o vite faz proxy do websocket também (ver vite.config.ts),
// então conectamos sempre na própria origem do frontend.
export function getSocket(token?: string | null): Socket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: { token: token ?? '' },
    });
  }
  return socket;
}

/** Desconecta e limpa o singleton — deve ser chamado no logout. */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
