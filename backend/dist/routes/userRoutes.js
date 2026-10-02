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
const userRepo = new repositories_1.UserRepository(db_1.db);
const userService = new services_1.UserService(db_1.db, userRepo);
// GET /api/users
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const isActive = req.query.is_active;
        const role = req.query.role;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const isActiveBool = isActive !== undefined ? (isActive === 'true') : undefined;
        const result = await userService.listUsers({
            search,
            isActive: isActiveBool,
            role,
            page,
            limit
        });
        res.json({
            data: result.rows,
            total: result.total,
            page: result.page,
            limit: result.limit
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// POST /api/users
router.post('/', async (req, res) => {
    const { username, password, role, is_active = true, stall_ids = [] } = req.body;
    try {
        const newUser = await userService.createUser({
            username,
            password,
            role,
            isActive: is_active,
            stallIds: stall_ids
        });
        res.json({ data: newUser, message: 'Usuário criado com sucesso.' });
    }
    catch (error) {
        if (error instanceof DomainErrors_1.ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: error.message });
            return;
        }
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// GET /api/users/:id
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const user = await userService.getUserById(id);
        res.json({ data: user });
    }
    catch (error) {
        if (error instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// PUT /api/users/:id
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { username, password, role, is_active, stall_ids = [] } = req.body;
    try {
        const updatedUser = await userService.updateUser(id, {
            username,
            password,
            role,
            isActive: is_active,
            stallIds: stall_ids
        });
        res.json({ data: updatedUser, message: 'Usuário atualizado com sucesso.' });
    }
    catch (error) {
        if (error instanceof DomainErrors_1.ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof DomainErrors_1.ConflictError) {
            res.status(409).json({ error: error.message });
            return;
        }
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// PATCH /api/users/:id/status
router.patch('/:id/status', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const updated = await userService.toggleUserStatus(id);
        res.json({ data: updated, message: 'Status atualizado com sucesso.' });
    }
    catch (error) {
        if (error instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        await userService.deleteUser(id);
        res.json({ message: 'Usuário excluído com sucesso.' });
    }
    catch (error) {
        if (error instanceof DomainErrors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
exports.default = router;
