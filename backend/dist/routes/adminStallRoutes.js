"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const socket_1 = require("../socket");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
router.use(middleware_1.requireAuth);
router.use(middleware_1.requireAdmin);
// GET /api/stalls
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const status = req.query.status; // 'true' | 'false'
        const type = req.query.type;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const offset = (page - 1) * limit;
        let queryArgs = [];
        let whereClauses = [];
        if (search) {
            whereClauses.push(`LOWER(name) LIKE LOWER($${queryArgs.length + 1})`);
            queryArgs.push(`%${search}%`);
        }
        if (status) {
            whereClauses.push(`is_active = $${queryArgs.length + 1}`);
            queryArgs.push(status === 'true');
        }
        if (type) {
            whereClauses.push(`type = $${queryArgs.length + 1}`);
            queryArgs.push(type);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const countResult = await db_1.db.query(`SELECT COUNT(*) FROM stalls ${whereString}`, queryArgs);
        const total = parseInt(countResult.rows[0].count, 10);
        let listQueryArgs = [...queryArgs];
        listQueryArgs.push(limit);
        listQueryArgs.push(offset);
        const limitIdx = listQueryArgs.length - 1;
        const offsetIdx = listQueryArgs.length;
        const dataResult = await db_1.db.query(`SELECT stall_id as id, stall_id, name, icon, type, is_active, created_at, updated_at 
       FROM stalls ${whereString} 
       ORDER BY created_at DESC 
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`, listQueryArgs);
        res.json({
            data: dataResult.rows,
            total,
            page,
            limit
        });
    }
    catch (err) {
        console.error('Error fetching stalls:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// POST /api/stalls
router.post('/', async (req, res) => {
    const { name, type, is_active = true, user_ids = [], icon = 'Store' } = req.body;
    if (!name || !type) {
        res.status(400).json({ error: 'Campos name e type são obrigatórios.' });
        return;
    }
    try {
        await db_1.db.query('BEGIN');
        const stall_id = (0, crypto_1.randomUUID)(); // Since we use TEXT for stall_id
        const insertResult = await db_1.db.query(`INSERT INTO stalls (stall_id, name, type, icon, is_active, updated_at) 
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`, [stall_id, name, type, icon, is_active]);
        const newStall = insertResult.rows[0];
        for (const userId of user_ids) {
            await db_1.db.query('INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)', [stall_id, userId]);
        }
        await db_1.db.query('COMMIT');
        // Sync to memory state
        db_1.state.stalls.push({
            id: stall_id,
            name,
            icon
        });
        (0, db_1.save)();
        (0, socket_1.broadcastState)();
        res.json({ data: newStall, message: 'Barraca criada.' });
    }
    catch (err) {
        await db_1.db.query('ROLLBACK');
        console.error('Error creating stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// GET /api/stalls/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const stallResult = await db_1.db.query('SELECT * FROM stalls WHERE stall_id = $1', [id]);
        if (stallResult.rows.length === 0) {
            res.status(404).json({ error: 'Barraca não encontrada.' });
            return;
        }
        const stall = stallResult.rows[0];
        const usersResult = await db_1.db.query('SELECT user_id FROM stall_users WHERE stall_id = $1', [id]);
        const userIds = usersResult.rows.map((r) => r.user_id);
        res.json({ data: { ...stall, user_ids: userIds } });
    }
    catch (err) {
        console.error('Error fetching stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PUT /api/stalls/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, is_active, user_ids = [], icon = 'Store' } = req.body;
    if (!name || !type) {
        res.status(400).json({ error: 'Campos name e type são obrigatórios.' });
        return;
    }
    try {
        await db_1.db.query('BEGIN');
        const updateResult = await db_1.db.query(`UPDATE stalls SET name = $1, type = $2, icon = $3, is_active = $4, updated_at = now() WHERE stall_id = $5 RETURNING *`, [name, type, icon, is_active, id]);
        if (updateResult.rows.length === 0) {
            await db_1.db.query('ROLLBACK');
            res.status(404).json({ error: 'Barraca não encontrada.' });
            return;
        }
        await db_1.db.query('DELETE FROM stall_users WHERE stall_id = $1', [id]);
        for (const userId of user_ids) {
            await db_1.db.query('INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)', [id, userId]);
        }
        await db_1.db.query('COMMIT');
        // Sync state memory
        const memoryIdx = db_1.state.stalls.findIndex(s => s.id === id);
        if (memoryIdx >= 0) {
            db_1.state.stalls[memoryIdx] = { ...db_1.state.stalls[memoryIdx], name, icon };
            (0, db_1.save)();
            (0, socket_1.broadcastState)();
        }
        res.json({ data: updateResult.rows[0], message: 'Barraca atualizada.' });
    }
    catch (err) {
        await db_1.db.query('ROLLBACK');
        console.error('Error updating stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PATCH /api/stalls/:id/status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    try {
        const checkResult = await db_1.db.query('SELECT is_active FROM stalls WHERE stall_id = $1', [id]);
        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Barraca não encontrada.' });
            return;
        }
        const current = checkResult.rows[0].is_active;
        const updateResult = await db_1.db.query('UPDATE stalls SET is_active = $1, updated_at = now() WHERE stall_id = $2 RETURNING *', [!current, id]);
        res.json({ data: updateResult.rows[0], message: 'Status atualizado.' });
    }
    catch (err) {
        console.error('Error patching stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// DELETE /api/stalls/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 409 check for products or tickets/orders. 
        // We will check if it has products linked
        const productsResult = await db_1.db.query('SELECT COUNT(*) FROM products WHERE stall_id = $1', [id]);
        if (parseInt(productsResult.rows[0].count, 10) > 0) {
            res.status(409).json({ error: 'Não é possível excluir barraca com produtos cadastrados. Desative a barraca.' });
            return;
        }
        const deleteResult = await db_1.db.query('DELETE FROM stalls WHERE stall_id = $1 RETURNING *', [id]);
        if (deleteResult.rows.length === 0) {
            res.status(404).json({ error: 'Barraca não encontrada.' });
            return;
        }
        // Remove from memory
        const memoryIdx = db_1.state.stalls.findIndex(s => s.id === id);
        if (memoryIdx >= 0) {
            db_1.state.stalls.splice(memoryIdx, 1);
            (0, db_1.save)();
            (0, socket_1.broadcastState)();
        }
        res.json({ message: 'Barraca excluída.' });
    }
    catch (err) {
        console.error('Error deleting stall:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
exports.default = router;
