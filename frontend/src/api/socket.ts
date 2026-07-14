import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Em dev, o vite faz proxy do websocket também (ver vite.config.ts),
// então conectamos sempre na própria origem do frontend.
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }
  return socket;
}
