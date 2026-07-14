const { Server } = require('socket.io');
const { publicState } = require('./db');

let io = null;

function initSocket(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true }
  });

  io.on('connection', (socket) => {
    // Ao conectar, o cliente já recebe o estado atual, então caixa e
    // barraca nunca ficam desatualizados mesmo se o socket demorar a conectar.
    socket.emit('state:update', publicState());

    socket.on('disconnect', () => {});
  });

  return io;
}

// Chamado depois de toda mutação (venda, produção, validação) para
// avisar todo mundo conectado (caixa central + todas as barracas) na hora.
function broadcastState() {
  if (io) {
    io.emit('state:update', publicState());
  }
}

module.exports = { initSocket, broadcastState };
