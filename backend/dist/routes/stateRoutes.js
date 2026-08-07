"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// GET /api/state — snapshot atual usado no carregamento inicial da tela.
// As atualizacoes seguintes chegam via WebSocket (state:update).
router.get('/', middleware_1.requireAuth, async (req, res) => {
    try {
        const state = await (0, db_1.fetchPublicState)();
        res.json(state);
    }
    catch (err) {
        console.error('Erro ao buscar estado:', err);
        res.status(500).json({ error: 'Erro interno ao buscar estado.' });
    }
});
exports.default = router;
