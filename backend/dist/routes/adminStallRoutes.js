"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const repositories_1 = require("../repositories");
const services_1 = require("../services");
const DomainErrors_1 = require("../errors/DomainErrors");
const router = (0, express_1.Router)();
router.use(middleware_1.requireAuth);
router.use(middleware_1.requireAdmin);
const stallRepo = new repositories_1.StallRepository(db_1.db);
const productRepo = new repositories_1.ProductRepository(db_1.db);
const stallService = new services_1.StallService(db_1.db, stallRepo, productRepo);
// GET /api/stalls
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const is_active = req.query.is_active;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const isActiveBool = is_active !== undefined ? (is_active === 'true') : undefined;
        const result = await stallService.listStalls({
            search,
            isActive: isActiveBool,
            page,
            limit
        });
        res.json(result);
    }
    catch (err) {
        console.error('Error fetching stalls:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// POST /api/stalls
router.post('/', async (req, res) => {
    const { name, type, is_active = true, user_ids = [], icon = 'Store' } = req.body;
    try {
        const newStall = await stallService.createStall({
            name,
            type,
            isActive: is_active,
            userIds: user_ids,
            icon
        }, req.user);
        res.json({ data: newStall, message: 'Barraca criada.' });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        console.error('Error creating stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// GET /api/stalls/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await stallService.getStallById(id);
        res.json({ data });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error('Error fetching stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PUT /api/stalls/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, is_active, user_ids = [], icon = 'Store' } = req.body;
    try {
        const updated = await stallService.updateStall(id, {
            name,
            type,
            isActive: is_active,
            userIds: user_ids,
            icon
        }, req.user);
        res.json({ data: updated, message: 'Barraca atualizada.' });
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
        console.error('Error updating stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PATCH /api/stalls/:id/status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await stallService.toggleStallStatus(id, req.user);
        res.json({ data: updated, message: 'Status atualizado.' });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error('Error patching stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// DELETE /api/stalls/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await stallService.deleteStall(id, req.user);
        res.json({ message: 'Barraca excluída.' });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error('Error deleting stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
exports.default = router;
