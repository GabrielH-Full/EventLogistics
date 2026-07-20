"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const { publicState } = require('../db');
const { requireAuth } = require('../middleware');
const router = (0, express_1.Router)();
// GET /api/state -> snapshot atual usado no carregamento inicial da tela.
// As atualizações seguintes chegam via WebSocket (state:update).
router.get('/', requireAuth, (req, res) => {
    res.json(publicState());
});
exports.default = router;
