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
const productRepo = new repositories_1.ProductRepository(db_1.db);
const productService = new services_1.ProductService(productRepo);
// GET /api/products
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const is_active = req.query.is_active;
        const stall_id = req.query.stall_id;
        const parent_type = req.query.parent_type;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const isActiveBool = is_active !== undefined ? (is_active === 'true') : undefined;
        const result = await productService.listProducts({
            search,
            isActive: isActiveBool,
            stallId: stall_id,
            category: parent_type,
            page,
            limit
        });
        res.json(result);
    }
    catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// POST /api/products
router.post('/', async (req, res) => {
    const { name, stall_id, category_id, price, is_active = true } = req.body;
    try {
        const created = await productService.createProduct({
            name,
            stallId: stall_id,
            categoryId: category_id,
            price,
            isActive: is_active
        }, req.user);
        res.json({ data: created, message: 'Produto criado.' });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await productService.getProductById(id);
        res.json({ data });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PUT /api/products/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, stall_id, category_id, price, is_active = true } = req.body;
    try {
        const updated = await productService.updateProduct(id, {
            name,
            stallId: stall_id,
            categoryId: category_id,
            price,
            isActive: is_active
        }, req.user);
        res.json({ data: updated, message: 'Produto atualizado.' });
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
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PATCH /api/products/:id/status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await productService.toggleProductStatus(id, req.user);
        res.json({ data: updated, message: 'Status atualizado.' });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error('Error patching product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await productService.deleteProduct(id, req.user);
        res.json({ message: 'Produto excluído.' });
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
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
exports.default = router;
