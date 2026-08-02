"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const auth_1 = require("../auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// POST /api/auth/login { username, password }
// Migrado de state.users (memória) para PostgreSQL (Task 7.0)
router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        res.status(400).json({ error: 'Informe usuário e senha.' });
        return;
    }
    try {
        // Busca no PostgreSQL (case-insensitive via LOWER)
        const result = await db_1.db.query(`SELECT user_id, username, password_hash, role, stall_id, display_name, is_active
       FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
        const row = result.rows[0];
        // Usuário não encontrado — mensagem genérica por segurança
        if (!row) {
            res.status(401).json({ error: 'Usuário ou senha inválidos.' });
            return;
        }
        // Conta desativada — mensagem específica
        if (!row.is_active) {
            res.status(401).json({ error: 'Usuário desativado. Fale com um administrador.' });
            return;
        }
        // Verificação de senha com bcrypt (hash armazenado no banco)
        const passwordMatch = await bcryptjs_1.default.compare(password, row.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Usuário ou senha inválidos.' });
            return;
        }
        // Montar objeto compatível com a interface User e gerar JWT
        const token = (0, auth_1.signToken)({
            id: row.user_id,
            username: row.username,
            passwordHash: row.password_hash, // necessário pela interface User — não incluído no payload do token
            role: row.role,
            stallId: row.stall_id,
            displayName: row.display_name,
        });
        res.json({
            token,
            user: {
                id: row.user_id,
                username: row.username,
                role: row.role,
                stallId: row.stall_id,
                displayName: row.display_name,
            }
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// GET /api/auth/me → valida o token salvo e devolve os dados do usuário,
// usado para manter a sessão ao recarregar a página.
router.get('/me', middleware_1.requireAuth, (req, res) => {
    res.json({ user: req.user });
});
exports.default = router;
