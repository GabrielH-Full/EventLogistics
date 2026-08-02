"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const auth_1 = require("./auth");
// Exige um Bearer token válido. Popula req.user com { sub, username, role, stallId, displayName }.
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        res.status(401).json({ error: 'Token ausente. Faça login novamente.' });
        return;
    }
    try {
        req.user = (0, auth_1.verifyToken)(token);
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    }
}
// Exige que o usuário autenticado tenha um dos papéis informados ('admin' | 'stall').
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Sua conta não tem permissão para essa ação.' });
            return;
        }
        next();
    };
}
exports.requireAdmin = requireRole('admin');
