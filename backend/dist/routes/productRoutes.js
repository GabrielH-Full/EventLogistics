"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const middleware_1 = require("../middleware");
const socket_1 = require("../socket");
const audit_1 = require("../audit");
const router = (0, express_1.Router)();
// POST /api/products/:id/production { amount }
// Só a barraca dona do produto pode registrar produção nova (reabastecimento).
router.post('/products/:id/production', middleware_1.requireAuth, (0, middleware_1.requireRole)('stall', 'operator'), async (req, res) => {
    const { id } = req.params;
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Quantidade de produção inválida.' });
    }
    try {
        const productRes = await db_1.db.query('SELECT * FROM products WHERE product_id = $1', [id]);
        if (productRes.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        const product = productRes.rows[0];
        if ((req.user.role === 'stall' || req.user.role === 'operator') && product.stall_id !== req.user.stallId) {
            return res.status(403).json({ error: 'Esse produto não pertence à sua barraca.' });
        }
        const before = { stock: product.stock };
        const updated = await db_1.db.query('UPDATE products SET stock = LEAST(max_stock, stock + $1) WHERE product_id = $2 RETURNING *', [amount, id]);
        const after = { stock: updated.rows[0].stock };
        (0, audit_1.logAudit)({
            userId: req.user.sub,
            action: 'PRODUCT_STOCK_UPDATED',
            entityType: 'products',
            entityId: id,
            before,
            after
        });
        (0, socket_1.broadcastState)();
        res.json({ product: updated.rows[0] });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao atualizar estoque.' });
    }
});
// POST /api/stalls/:stallId/reset
// Restaura o estoque apenas dos produtos daquela barraca para 0
router.post('/stalls/:stallId/reset', middleware_1.requireAuth, (0, middleware_1.requireRole)('stall', 'operator', 'admin'), async (req, res) => {
    const { stallId } = req.params;
    if ((req.user.role === 'stall' || req.user.role === 'operator') && req.user.stallId !== stallId) {
        return res.status(403).json({ error: 'Você só pode redefinir sua própria barraca.' });
    }
    try {
        await db_1.db.query('UPDATE products SET stock = 0 WHERE stall_id = $1', [stallId]);
        (0, audit_1.logAudit)({
            userId: req.user.sub,
            action: 'STALL_STOCK_RESET',
            entityType: 'stalls',
            entityId: stallId,
            before: null,
            after: { stock: 0 }
        });
        (0, socket_1.broadcastState)();
        const productsRes = await db_1.db.query('SELECT * FROM products WHERE stall_id = $1 ORDER BY name', [stallId]);
        res.json({ products: productsRes.rows });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao resetar estoque.' });
    }
});
exports.default = router;
