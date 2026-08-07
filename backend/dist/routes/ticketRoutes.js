"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const middleware_1 = require("../middleware");
const socket_1 = require("../socket");
const audit_1 = require("../audit");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
// POST /api/tickets  { items: [{ productId, quantity }] }
// Só a conta ADM (Caixa Central) vende tickets.
router.post('/', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin'), async (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
    }
    const client = await db_1.db.connect();
    try {
        await client.query('BEGIN');
        const resolvedItems = [];
        let total = 0;
        for (const { productId, quantity } of items) {
            if (quantity <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Quantidade inválida.` });
            }
            const resProd = await client.query('SELECT stock, name, price, category, stall_id FROM products WHERE product_id = $1 FOR UPDATE', [productId]);
            if (resProd.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: `Produto ${productId} não encontrado.` });
            }
            const product = resProd.rows[0];
            if (product.stock < quantity) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    error: `Estoque insuficiente para "${product.name}". Restam apenas ${product.stock}.`,
                    productId: productId,
                    available: product.stock
                });
            }
            resolvedItems.push({
                productId,
                name: product.name,
                category: product.category,
                price: Number(product.price),
                quantity
            });
            total += Number(product.price) * quantity;
        }
        const ticket_id = (0, crypto_1.randomUUID)();
        const code = '#' + Math.floor(8000 + Math.random() * 999);
        const now = new Date();
        await client.query('INSERT INTO tickets (ticket_id, code, total, status, created_at) VALUES ($1, $2, $3, $4, $5)', [ticket_id, code, total, 'pending', now.toISOString()]);
        for (const item of resolvedItems) {
            await client.query('INSERT INTO ticket_items (ticket_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)', [ticket_id, item.productId, item.quantity, item.price]);
            await client.query('UPDATE products SET stock = stock - $1 WHERE product_id = $2', [item.quantity, item.productId]);
        }
        await client.query('COMMIT');
        // The frontend expects a Ticket object matching the old state shape
        const newTicket = {
            id: ticket_id,
            code,
            items: resolvedItems,
            total,
            time: 'Agora',
            timestamp: now.toISOString(),
            status: 'pending'
        };
        (0, audit_1.logAudit)({
            userId: req.user.sub,
            action: 'TICKET_CREATED',
            entityType: 'tickets',
            entityId: ticket_id,
            after: newTicket
        });
        (0, socket_1.broadcastState)();
        res.status(201).json({ ticket: newTicket });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao criar ticket.' });
    }
    finally {
        client.release();
    }
});
// POST /api/tickets/:id/validate
// A barraca só pode validar tickets que contenham pelo menos um item dela.
router.post('/:id/validate', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin', 'stall', 'operator'), async (req, res) => {
    const { id } = req.params;
    const client = await db_1.db.connect();
    try {
        await client.query('BEGIN');
        const resTicket = await client.query('SELECT * FROM tickets WHERE ticket_id = $1 FOR UPDATE', [id]);
        if (resTicket.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }
        if (req.user.role === 'stall' || req.user.role === 'operator') {
            const resCheck = await client.query(`
          SELECT COUNT(*) 
          FROM ticket_items ti 
          JOIN products p ON ti.product_id = p.product_id 
          WHERE ti.ticket_id = $1 AND p.stall_id = $2
        `, [id, req.user.stallId]);
            if (Number(resCheck.rows[0].count) === 0) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'Esse ticket não pertence à sua barraca.' });
            }
        }
        const updatedTicketRes = await client.query("UPDATE tickets SET status = 'validated' WHERE ticket_id = $1 RETURNING *", [id]);
        await client.query('COMMIT');
        // Fetch items to return the complete object expected by the frontend
        const resItems = await db_1.db.query(`SELECT ti.product_id, ti.quantity, ti.unit_price, p.name, p.category 
         FROM ticket_items ti 
         JOIN products p ON ti.product_id = p.product_id 
         WHERE ti.ticket_id = $1`, [id]);
        const items = resItems.rows.map(row => ({
            productId: row.product_id,
            name: row.name,
            category: row.category,
            price: Number(row.unit_price),
            quantity: row.quantity
        }));
        const ticketToReturn = {
            id: updatedTicketRes.rows[0].ticket_id,
            code: updatedTicketRes.rows[0].code,
            items: items,
            total: Number(updatedTicketRes.rows[0].total),
            time: 'Agora mesmo',
            timestamp: updatedTicketRes.rows[0].created_at,
            status: updatedTicketRes.rows[0].status
        };
        (0, audit_1.logAudit)({
            userId: req.user.sub,
            action: 'TICKET_VALIDATED',
            entityType: 'tickets',
            entityId: id,
            before: { status: 'pending' },
            after: { status: 'validated' }
        });
        (0, socket_1.broadcastState)();
        res.json({ ticket: ticketToReturn });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao validar ticket.' });
    }
    finally {
        client.release();
    }
});
exports.default = router;
