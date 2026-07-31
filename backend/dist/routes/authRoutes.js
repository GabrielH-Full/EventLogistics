"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../auth");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// POST /api/auth/login { username, password }
router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Informe usuário e senha.' });
    }
    const user = db_1.state.users.find(u => u.username === username);
    if (!user || !(0, auth_1.checkPassword)(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }
    const token = (0, auth_1.signToken)(user);
    return res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            stallId: user.stallId,
            displayName: user.displayName
        }
    });
});
// GET /api/auth/me -> valida o token salvo e devolve os dados do usuário,
// usado para manter a sessão ao recarregar a página.
router.get('/me', middleware_1.requireAuth, (req, res) => {
    res.json({ user: req.user });
});
exports.default = router;