"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const repositories_1 = require("../repositories");
const services_1 = require("../services");
const middleware_1 = require("../middleware");
const DomainErrors_1 = require("../errors/DomainErrors");
const router = (0, express_1.Router)();
const productRepo = new repositories_1.ProductRepository(db_1.db);
const inventoryService = new services_1.InventoryService(productRepo);
// POST /api/products/:id/production { amount }
// Só a barraca dona do produto pode registrar produção nova (reabastecimento).
router.post('/products/:id/production', middleware_1.requireAuth, (0, middleware_1.requireRole)('stall', 'operator'), async (req, res) => {
    const { id } = req.params;
    const amount = Number(req.body?.amount);
    try {
        const product = await inventoryService.addProduction(id, amount, req.user);
        res.json({ product });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ForbiddenError) {
            res.status(403).json({ error: err.message });
            return;
        }
        console.error('[ProductRoutes /production] Erro:', err);
        res.status(500).json({ error: 'Erro interno ao atualizar estoque.' });
    }
});
// POST /api/stalls/:stallId/reset
// Restaura o estoque apenas dos produtos daquela barraca para 0
router.post('/stalls/:stallId/reset', middleware_1.requireAuth, (0, middleware_1.requireRole)('stall', 'operator', 'admin'), async (req, res) => {
    const { stallId } = req.params;
    try {
        const products = await inventoryService.resetStallStock(stallId, req.user);
        res.json({ products });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.ForbiddenError) {
            res.status(403).json({ error: err.message });
            return;
        }
        console.error('[ProductRoutes /reset] Erro:', err);
        res.status(500).json({ error: 'Erro interno ao resetar estoque.' });
    }
});
exports.default = router;
