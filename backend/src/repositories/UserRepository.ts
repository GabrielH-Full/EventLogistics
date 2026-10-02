import { Pool, PoolClient } from 'pg';
import { UserRow, UserFilters } from '../types/db';

export class UserRepository {
  constructor(private pool: Pool) {}

  private getExecutor(client?: PoolClient): Pool | PoolClient {
    return client || this.pool;
  }

  async findAll(filters: UserFilters = {}): Promise<{ rows: any[]; total: number }> {
    const search = filters.search || '';
    const isActive = filters.isActive;
    const role = filters.role;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const queryArgs: any[] = [];
    const countQueryArgs: any[] = [];
    const whereClauses: string[] = [];

    if (search) {
      whereClauses.push(`LOWER(username) LIKE LOWER($${queryArgs.length + 1})`);
      queryArgs.push(`%${search}%`);
      countQueryArgs.push(`%${search}%`);
    }
    if (isActive !== undefined) {
      whereClauses.push(`is_active = $${queryArgs.length + 1}`);
      queryArgs.push(isActive);
      countQueryArgs.push(isActive);
    }
    if (role) {
      whereClauses.push(`role = $${queryArgs.length + 1}`);
      queryArgs.push(role);
      countQueryArgs.push(role);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM users ${whereString}`,
      countQueryArgs
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const listQueryArgs = [...queryArgs, limit, offset];
    const limitIdx = listQueryArgs.length - 1;
    const offsetIdx = listQueryArgs.length;

    const dataResult = await this.pool.query(
      `SELECT user_id as id, user_id, username, role, stall_id, display_name, created_at, is_active, updated_at,
         (
           SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.stall_id, 'name', s.name)), '[]'::jsonb)
           FROM stall_users su
           JOIN stalls s ON s.stall_id = su.stall_id
           WHERE su.user_id = users.user_id
         ) as stalls
       FROM users ${whereString} 
       ORDER BY created_at DESC 
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listQueryArgs
    );

    return { rows: dataResult.rows, total };
  }

  async findById(id: number, client?: PoolClient): Promise<UserRow | null> {
    const res = await this.getExecutor(client).query(
      'SELECT * FROM users WHERE user_id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  async findByUsername(username: string, client?: PoolClient): Promise<UserRow | null> {
    const res = await this.getExecutor(client).query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    return res.rows[0] || null;
  }

  async create(client: PoolClient, data: {
    username: string;
    passwordHash: string;
    role: string;
    displayName?: string;
    isActive?: boolean;
  }): Promise<UserRow> {
    const res = await client.query(
      `INSERT INTO users (username, password_hash, role, display_name, is_active, updated_at) 
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
      [
        data.username,
        data.passwordHash,
        data.role,
        data.displayName || data.username,
        data.isActive ?? true
      ]
    );
    return res.rows[0];
  }

  async update(client: PoolClient, id: number, data: {
    username: string;
    role: string;
    passwordHash?: string;
    displayName?: string;
    isActive?: boolean | null;
  }): Promise<UserRow | null> {
    const displayName = data.displayName || data.username;
    const isActiveParam = data.isActive !== undefined ? data.isActive : null;

    let res;
    if (data.passwordHash) {
      res = await client.query(
        `UPDATE users 
         SET username = $1, password_hash = $2, role = $3, display_name = $4, is_active = COALESCE($5, is_active), updated_at = now() 
         WHERE user_id = $6 RETURNING *`,
        [data.username, data.passwordHash, data.role, displayName, isActiveParam, id]
      );
    } else {
      res = await client.query(
        `UPDATE users 
         SET username = $1, role = $2, display_name = $3, is_active = COALESCE($4, is_active), updated_at = now() 
         WHERE user_id = $5 RETURNING *`,
        [data.username, data.role, displayName, isActiveParam, id]
      );
    }
    return res.rows[0] || null;
  }

  async toggleStatus(id: number, client?: PoolClient): Promise<UserRow | null> {
    const executor = this.getExecutor(client);
    const userRes = await executor.query('SELECT is_active FROM users WHERE user_id = $1', [id]);
    if (userRes.rows.length === 0) return null;

    const currentStatus = userRes.rows[0].is_active;
    const res = await executor.query(
      'UPDATE users SET is_active = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      [!currentStatus, id]
    );
    return res.rows[0] || null;
  }

  async delete(id: number, client?: PoolClient): Promise<UserRow | null> {
    const res = await this.getExecutor(client).query(
      'DELETE FROM users WHERE user_id = $1 RETURNING *',
      [id]
    );
    return res.rows[0] || null;
  }

  async syncStalls(userId: number, stallIds: string[], client: PoolClient): Promise<void> {
    await client.query('DELETE FROM stall_users WHERE user_id = $1', [userId]);
    for (const stallId of stallIds) {
      await client.query(
        'INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)',
        [stallId, userId]
      );
    }
  }

  async getStallsByUserId(userId: number, client?: PoolClient): Promise<string[]> {
    const res = await this.getExecutor(client).query(
      'SELECT stall_id FROM stall_users WHERE user_id = $1',
      [userId]
    );
    return res.rows.map((r: any) => r.stall_id);
  }
}
