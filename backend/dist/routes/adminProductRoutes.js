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
// Helper function to sync state products based on database queries
const syncStateProducts = async () => {
    try {
        const productsRes = await db_1.db.query('SELECT * FROM products WHERE is_active = true');
        const dbProducts = productsRes.rows;
        // Update matching products in state or add new ones
        dbProducts.forEach((dbP) => {
            const pIdx = db_1.state.products.findIndex(sp => sp.id === dbP.product_id);
            if (pIdx >= 0) {
                db_1.state.products[pIdx].name = dbP.name;
                db_1.state.products[pIdx].category = dbP.category;
                db_1.state.products[pIdx].price = Number(dbP.price);
                db_1.state.products[pIdx].stallId = dbP.stall_id;
                db_1.state.products[pIdx].image = dbP.image;
                db_1.state.products[pIdx].stock = dbP.stock;
                db_1.state.products[pIdx].maxStock = dbP.max_stock;
                db_1.state.products[pIdx].unit = dbP.unit;
            }
            else {
                db_1.state.products.push({
                    id: dbP.product_id,
                    name: dbP.name,
                    category: dbP.category,
                    price: Number(dbP.price),
                    stallId: dbP.stall_id,
                    image: dbP.image,
                    stock: dbP.stock,
                    maxStock: dbP.max_stock,
                    unit: dbP.unit
                });
            }
        });
        // Remove inactive from state
        const activeIds = dbProducts.map((dp) => dp.product_id);
        db_1.state.products = db_1.state.products.filter(sp => activeIds.includes(sp.id));
        (0, db_1.save)();
        (0, socket_1.broadcastState)();
    }
    catch (e) {
        console.error('Error syncing products state:', e);
    }
};
// GET /api/products
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const is_active = req.query.is_active; // 'true' | 'false'
        const stall_id = req.query.stall_id;
        const parent_type = req.query.parent_type; // 'food' | 'drink'
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const offset = (page - 1) * limit;
        let queryArgs = [];
        let whereClauses = [];
        if (search) {
            whereClauses.push(`LOWER(p.name) LIKE LOWER($${queryArgs.length + 1})`);
            queryArgs.push(`%${search}%`);
        }
        if (is_active && (is_active === 'true' || is_active === 'false')) {
            whereClauses.push(`p.is_active = $${queryArgs.length + 1}`);
            queryArgs.push(is_active === 'true');
        }
        if (stall_id) {
            whereClauses.push(`p.stall_id = $${queryArgs.length + 1}`);
            queryArgs.push(stall_id);
        }
        if (parent_type) {
            whereClauses.push(`c.parent_type = $${queryArgs.length + 1}`);
            queryArgs.push(parent_type);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const joinString = parent_type ? `LEFT JOIN product_categories c ON p.category_id = c.category_id` : '';
        const countResult = await db_1.db.query(`SELECT COUNT(*) FROM products p ${joinString} ${whereString}`, queryArgs);
        const total = parseInt(countResult.rows[0].count, 10);
        let listQueryArgs = [...queryArgs];
        listQueryArgs.push(limit);
        listQueryArgs.push(offset);
        const limitIdx = listQueryArgs.length - 1;
        const offsetIdx = listQueryArgs.length;
        const dataResult = await db_1.db.query(`SELECT p.product_id as id, p.*, s.name as stall_name, c.name as subcategory_name, c.parent_type
       FROM products p 
       LEFT JOIN stalls s ON p.stall_id = s.stall_id
       LEFT JOIN product_categories c ON p.category_id = c.category_id
       ${whereString}
       ORDER BY p.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`, listQueryArgs);
        res.json({ data: dataResult.rows, total, page, limit });
    }
    catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// POST /api/products
router.post('/', async (req, res) => {
    const { name, stall_id, category_id, price, is_active = true } = req.body;
    if (!name || !stall_id || !category_id || price === undefined) {
        res.status(400).json({ error: 'Campos name, stall_id, category_id, price são obrigatórios.' });
        return;
    }
    if (typeof price !== 'number' || price <= 0 || isNaN(price)) {
        res.status(400).json({ error: 'Preço inválido — deve ser um número positivo.' });
        return;
    }
    try {
        const product_id = (0, crypto_1.randomUUID)();
        // Default mock data for legacy text constraints
        const categoryText = 'Salgados'; // temporary mock for old constraint CHECK(category IN ('Salgados', 'Doces', 'Bebidas'))
        const maxStock = 100;
        const unit = 'un';
        const image = 'food.png';
        const insertResult = await db_1.db.query(`INSERT INTO products 
      (product_id, stall_id, category_id, name, price, is_active, updated_at, stock, max_stock, unit, image, category) 
      VALUES ($1, $2, $3, $4, $5, $6, now(), $7, $8, $9, $10, $11) RETURNING *`, [product_id, stall_id, category_id, name, price, is_active, 0, maxStock, unit, image, categoryText]);
        await syncStateProducts();
        res.json({ data: insertResult.rows[0], message: 'Produto criado.' });
    }
    catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.db.query(`
       SELECT p.*, s.name as stall_name, c.name as subcategory_name, c.parent_type
       FROM products p 
       LEFT JOIN stalls s ON p.stall_id = s.stall_id
       LEFT JOIN product_categories c ON p.category_id = c.category_id
       WHERE p.product_id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Produto não encontrado.' });
            return;
        }
        res.json({ data: result.rows[0] });
    }
    catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PUT /api/products/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, stall_id, category_id, price, is_active = true } = req.body;
    if (typeof price !== 'number' || price <= 0 || isNaN(price)) {
        res.status(400).json({ error: 'Preço inválido — deve ser um número positivo.' });
        return;
    }
    try {
        const result = await db_1.db.query(`UPDATE products 
       SET name=$1, stall_id=$2, category_id=$3, price=$4, is_active=$5, updated_at=now() 
       WHERE product_id=$6 RETURNING *`, [name, stall_id, category_id, price, is_active, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Produto não encontrado.' });
            return;
        }
        await syncStateProducts();
        res.json({ data: result.rows[0], message: 'Produto atualizado.' });
    }
    catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// PATCH /api/products/:id/status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    try {
        const checkResult = await db_1.db.query('SELECT is_active FROM products WHERE product_id = $1', [id]);
        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: 'Produto não encontrado.' });
            return;
        }
        const current = checkResult.rows[0].is_active;
        const result = await db_1.db.query('UPDATE products SET is_active=$1, updated_at=now() WHERE product_id=$2 RETURNING *', [!current, id]);
        await syncStateProducts();
        res.json({ data: result.rows[0], message: 'Status atualizado.' });
    }
    catch (err) {
        console.error('Error patching product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const checkResult = await db_1.db.query('SELECT COUNT(*) FROM ticket_items WHERE product_id = $1', [id]);
        if (parseInt(checkResult.rows[0].count, 10) > 0) {
            res.status(409).json({ error: 'Não é possível excluir produto com histórico de vendas (tickets). Desative o produto.' });
            return;
        }
        const deleteResult = await db_1.db.query('DELETE FROM products WHERE product_id = $1 RETURNING *', [id]);
        if (deleteResult.rows.length === 0) {
            res.status(404).json({ error: 'Produto não encontrado.' });
            return;
        }
        await syncStateProducts();
        res.json({ message: 'Produto excluído.' });
    }
    catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});
exports.default = router;
