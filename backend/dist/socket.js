"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.broadcastToStall = broadcastToStall;
exports.broadcastState = broadcastState;
const socket_io_1 = require("socket.io");
const db_1 = require("./db");
const auth_1 = require("./auth");
let io = null;
function initSocket(httpServer, corsOrigins) {
    io = new socket_io_1.Server(httpServer, {
        cors: { origin: corsOrigins, credentials: true }
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Authentication required'));
        try {
            socket.data.user = (0, auth_1.verifyToken)(token);
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', async (socket) => {
        const stallId = socket.data.user?.stallId;
        if (stallId) {
            socket.join(`stall_${stallId}`);
        }
        try {
            const state = await (0, db_1.fetchPublicState)();
            socket.emit('state:update', state);
        }
        catch (err) {
            console.error('[socket] Falha ao emitir estado inicial:', err);
        }
        socket.on('disconnect', () => { });
    });
    return io;
}
function broadcastToStall(stallId, event, data) {
    if (!io)
        return;
    io.to(`stall_${stallId}`).emit(event, data);
}
// Chamado depois de toda mutação para avisar todos os clientes conectados
async function broadcastState() {
    if (!io)
        return;
    try {
        const state = await (0, db_1.fetchPublicState)();
        io.emit('state:update', state);
    }
    catch (err) {
        console.error('[broadcastState] Falha ao buscar estado do banco:', err);
        // Silencia — clientes se recuperam via reconexao WebSocket ou GET /api/state
    }
}
