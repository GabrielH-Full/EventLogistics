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
const categoryRepo = new repositories_1.CategoryRepository(db_1.db);
const productRepo = new repositories_1.ProductRepository(db_1.db);
const categoryService = new services_1.CategoryService(categoryRepo, productRepo);
// GET /api/product-categories
router.get('/', async (req, res) => {
    try {
        const parentType = req.query.parent_type;
        const data = await categoryService.listCategories(parentType);
        res.json({ data });
    }
    catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// POST /api/product-categories
router.post('/', async (req, res) => {
    const { name, parent_type } = req.body;
    try {
        const created = await categoryService.createCategory(name, parent_type);
        res.json({ data: created, message: 'Subcategoria criada.' });
    }
    catch (err) {
        if (err instanceof DomainErrors_1.ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error('Error creating category:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// DELETE /api/product-categories/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await categoryService.deleteCategory(id);
        res.json({ message: 'Subcategoria excluída com sucesso.' });
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
        console.error('Error deleting category:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
exports.default = router;
