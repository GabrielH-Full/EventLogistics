"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const db_1 = require("../db");
const repositories_1 = require("../repositories");
const services_1 = require("../services");
const middleware_1 = require("../middleware");
const DomainErrors_1 = require("../errors/DomainErrors");
const router = (0, express_1.Router)();
const ticketRepo = new repositories_1.TicketRepository(db_1.db);
const productRepo = new repositories_1.ProductRepository(db_1.db);
const ticketService = new services_1.TicketService(db_1.db, ticketRepo, productRepo);
// POST /api/tickets  { items: [{ productId, quantity }] }
// Só a conta ADM (Caixa Central) vende tickets.
router.post('/', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin'), async (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'O carrinho está vazio.' });
        return;
    }
    try {
        const ticket = await ticketService.createTicket(items, req.user.sub);
        res.status(201).json({ ticket });
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
        if (err instanceof DomainErrors_1.InsufficientStockError) {
            res.status(409).json({
                error: err.message,
                productId: err.productId,
                available: err.available
            });
            return;
        }
        if (err instanceof DomainErrors_1.ForbiddenError) {
            res.status(403).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error('[TicketRoutes POST /] Erro:', err);
        res.status(500).json({ error: 'Erro interno ao criar ticket.' });
    }
});
// POST /api/tickets/validate (Validação direta de itens na barraca)
router.post('/validate', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin', 'operator', 'stall'), async (req, res) => {
    const { items } = req.body;
    const stallId = req.user.stallId;
    const operatorId = Number(req.user.sub);
    if (!stallId) {
        res.status(403).json({ error: 'Operador não associado a uma barraca.' });
        return;
    }
    if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'O carrinho está vazio.' });
        return;
    }
    const ticketId = (0, crypto_1.randomUUID)();
    try {
        await ticketService.validateDirectSell(ticketId, stallId, operatorId, items);
        res.status(201).json({ success: true, ticketId });
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
        if (err instanceof DomainErrors_1.InsufficientStockError) {
            res.status(409).json({ error: err.message, productId: err.productId, available: err.available });
            return;
        }
        console.error('[TicketRoutes POST /validate] Erro:', err);
        res.status(400).json({ error: err.message || 'Erro ao validar ticket.' });
    }
});
// POST /api/tickets/:id/validate
// A barraca só pode validar tickets que contenham pelo menos um item dela.
router.post('/:id/validate', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin', 'stall', 'operator'), async (req, res) => {
    const { id } = req.params;
    try {
        const ticket = await ticketService.validateTicket(id, req.user);
        res.json({ ticket });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ForbiddenError) {
            res.status(403).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error('[TicketRoutes POST /:id/validate] Erro:', err);
        res.status(500).json({ error: 'Erro interno ao validar ticket.' });
    }
});
// POST /api/tickets/:id/revert
router.post('/:id/revert', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin', 'operator', 'stall'), async (req, res) => {
    const { id } = req.params;
    const stallId = req.user.stallId;
    if (!stallId && req.user.role !== 'admin') {
        res.status(403).json({ error: 'Operador não associado a uma barraca.' });
        return;
    }
    try {
        await ticketService.revertTicket(id, req.user);
        res.status(200).json({ success: true, ticketId: id });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ForbiddenError) {
            res.status(403).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error('[TicketRoutes POST /:id/revert] Erro:', err);
        res.status(400).json({ error: err.message || 'Erro ao reverter ticket.' });
    }
});
exports.default = router;
