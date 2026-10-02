"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
class CategoryRepository {
    constructor(pool) {
        this.pool = pool;
    }
    getExecutor(client) {
        return client || this.pool;
    }
    async findAll(parentType, client) {
        let query = 'SELECT category_id as id, * FROM product_categories';
        const params = [];
        if (parentType === 'food' || parentType === 'drink') {
            query += ' WHERE parent_type = $1';
            params.push(parentType);
        }
        query += ' ORDER BY name ASC';
        const res = await this.getExecutor(client).query(query, params);
        return res.rows;
    }
    async findById(categoryId, client) {
        const res = await this.getExecutor(client).query('SELECT * FROM product_categories WHERE category_id = $1', [categoryId]);
        return res.rows[0] || null;
    }
    async create(data, client) {
        const res = await this.getExecutor(client).query('INSERT INTO product_categories (name, parent_type) VALUES ($1, $2) RETURNING *', [data.name, data.parentType]);
        return res.rows[0];
    }
    async delete(categoryId, client) {
        const res = await this.getExecutor(client).query('DELETE FROM product_categories WHERE category_id = $1 RETURNING category_id', [categoryId]);
        return res.rows[0]?.category_id || null;
    }
}
exports.CategoryRepository = CategoryRepository;
