"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const middleware_1 = require("../middleware");
const socket_1 = require("../socket");
const router = (0, express_1.Router)();
// POST /api/tickets  { items: [{ productId, quantity }] }
// Só a conta ADM (Caixa Central) vende tickets.
// Regra de negócio central do projeto: a venda só é aceita se TODOS os itens
// tiverem estoque suficiente no momento da venda. Isso é o que impede vender
// ticket de um produto que a barraca já não tem mais.
router.post('/', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin'), (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
    }
    const resolvedItems = [];
    for (const { productId, quantity } of items) {
        const product = db_1.state.products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ error: `Produto ${productId} não encontrado.` });
        }
        if (quantity <= 0) {
            return res.status(400).json({ error: `Quantidade inválida para ${product.name}.` });
        }
        if (product.stock < quantity) {
            return res.status(409).json({
                error: `Estoque insuficiente para "${product.name}". Restam apenas ${product.stock}.`,
                productId: product.id,
                available: product.stock
            });
        }
        resolvedItems.push({ product, quantity });
    }
    // Todas as validações passaram: agora sim debita o estoque e cria o ticket.
    const ticketItems = resolvedItems.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity
    }));
    resolvedItems.forEach(({ product, quantity }) => {
        product.stock = Math.max(0, product.stock - quantity);
    });
    const total = ticketItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const newTicket = {
        id: 'ticket_' + Date.now(),
        code: '#' + Math.floor(8000 + Math.random() * 999),
        items: ticketItems,
        total,
        time: 'Agora',
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    db_1.state.tickets.unshift(newTicket);
    (0, db_1.save)();
    (0, socket_1.broadcastState)();
    res.status(201).json({ ticket: newTicket });
});
// POST /api/tickets/:id/validate
// A barraca só pode validar tickets que contenham pelo menos um item dela.
// A conta ADM também pode validar, para dar suporte/fiscalização.
router.post('/:id/validate', middleware_1.requireAuth, (0, middleware_1.requireRole)('admin', 'stall', 'operator'), (req, res) => {
    const ticket = db_1.state.tickets.find(t => t.id === req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado.' });
    }
    if (req.user.role === 'stall' || req.user.role === 'operator') {
        const belongsToStall = ticket.items.some(item => {
            const product = db_1.state.products.find(p => p.id === item.productId);
            return product && product.stallId === req.user.stallId;
        });
        if (!belongsToStall) {
            return res.status(403).json({ error: 'Esse ticket não pertence à sua barraca.' });
        }
    }
    ticket.status = 'validated';
    ticket.time = 'Agora mesmo';
    (0, db_1.save)();
    (0, socket_1.broadcastState)();
    res.json({ ticket });
});
exports.default = router;
