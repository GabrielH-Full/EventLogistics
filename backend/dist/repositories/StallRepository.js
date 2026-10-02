"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StallRepository = void 0;
class StallRepository {
    constructor(pool) {
        this.pool = pool;
    }
    getExecutor(client) {
        return client || this.pool;
    }
    async findAll(filters = {}) {
        const search = filters.search || '';
        const isActive = filters.isActive;
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const offset = (page - 1) * limit;
        const queryArgs = [];
        const whereClauses = [];
        if (search) {
            whereClauses.push(`LOWER(name) LIKE LOWER($${queryArgs.length + 1})`);
            queryArgs.push(`%${search}%`);
        }
        if (isActive !== undefined) {
            whereClauses.push(`is_active = $${queryArgs.length + 1}`);
            queryArgs.push(isActive);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const countResult = await this.pool.query(`SELECT COUNT(*) FROM stalls ${whereString}`, queryArgs);
        const total = parseInt(countResult.rows[0].count, 10);
        const listQueryArgs = [...queryArgs, limit, offset];
        const limitIdx = listQueryArgs.length - 1;
        const offsetIdx = listQueryArgs.length;
        const dataResult = await this.pool.query(`SELECT stall_id as id, stall_id, name, icon, type, is_active, created_at, updated_at 
       FROM stalls ${whereString} 
       ORDER BY created_at DESC 
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`, listQueryArgs);
        return { rows: dataResult.rows, total };
    }
    async findById(id, client) {
        const res = await this.getExecutor(client).query('SELECT * FROM stalls WHERE stall_id = $1', [id]);
        return res.rows[0] || null;
    }
    async findByIdWithUserIds(id, client) {
        const executor = this.getExecutor(client);
        const stallRes = await executor.query('SELECT * FROM stalls WHERE stall_id = $1', [id]);
        if (stallRes.rows.length === 0)
            return null;
        const usersRes = await executor.query('SELECT user_id FROM stall_users WHERE stall_id = $1', [id]);
        const userIds = usersRes.rows.map((r) => r.user_id);
        return { stall: stallRes.rows[0], userIds };
    }
    async create(data, client) {
        const res = await this.getExecutor(client).query(`INSERT INTO stalls (stall_id, name, type, icon, is_active, updated_at) 
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`, [data.stallId, data.name, data.type, data.icon || 'Store', data.isActive ?? true]);
        return res.rows[0];
    }
    async update(id, data, client) {
        const isActiveParam = data.isActive !== undefined ? data.isActive : null;
        const res = await this.getExecutor(client).query(`UPDATE stalls 
       SET name = $1, type = $2, icon = $3, is_active = COALESCE($4, is_active), updated_at = now() 
       WHERE stall_id = $5 RETURNING *`, [data.name, data.type, data.icon || 'Store', isActiveParam, id]);
        return res.rows[0] || null;
    }
    async toggleStatus(id, client) {
        const executor = this.getExecutor(client);
        const checkResult = await executor.query('SELECT is_active FROM stalls WHERE stall_id = $1', [id]);
        if (checkResult.rows.length === 0)
            return null;
        const current = checkResult.rows[0].is_active;
        const res = await executor.query('UPDATE stalls SET is_active = $1, updated_at = now() WHERE stall_id = $2 RETURNING *', [!current, id]);
        return res.rows[0] || null;
    }
    async delete(id, client) {
        const res = await this.getExecutor(client).query('DELETE FROM stalls WHERE stall_id = $1 RETURNING *', [id]);
        return res.rows[0] || null;
    }
    async syncUsers(stallId, userIds, client) {
        await client.query('DELETE FROM stall_users WHERE stall_id = $1', [stallId]);
        for (const userId of userIds) {
            await client.query('INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)', [stallId, userId]);
        }
    }
    async getUserIdsByStallId(stallId, client) {
        const res = await this.getExecutor(client).query('SELECT user_id FROM stall_users WHERE stall_id = $1', [stallId]);
        return res.rows.map((r) => r.user_id);
    }
}
exports.StallRepository = StallRepository;
