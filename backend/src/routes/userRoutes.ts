import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware';
import { requireAdmin } from '../middleware';
import { db } from '../db';

const router = Router();

// Apply requireAuth and requireAdmin to all routes in this file
router.use(requireAuth);
router.use(requireAdmin);

// Formato padrão esperado:
// interface CreateUserBody {
//   username: string;
//   password?: string;
//   role: 'admin' | 'stall' | 'operator';
//   is_active?: boolean;
//   stall_ids?: string[];
// }

// Helper function to remove password
const stripPassword = (user: any) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// GET /api/users
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const status = req.query.status as string; // 'true' | 'false'
    const role = req.query.role as string;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);

    const offset = (page - 1) * limit;
    
    let queryArgs: any[] = [];
    let countQueryArgs: any[] = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`LOWER(username) LIKE LOWER($${queryArgs.length + 1})`);
      queryArgs.push(`%${search}%`);
      countQueryArgs.push(`%${search}%`);
    }
    if (status) {
      whereClauses.push(`is_active = $${queryArgs.length + 1}`);
      const isActive = status === 'true';
      queryArgs.push(isActive);
      countQueryArgs.push(isActive);
    }
    if (role) {
      whereClauses.push(`role = $${queryArgs.length + 1}`);
      queryArgs.push(role);
      countQueryArgs.push(role);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM users ${whereString}`, countQueryArgs);
    const total = parseInt(countResult.rows[0].count, 10);

    // Limit and offset
    queryArgs.push(limit);
    queryArgs.push(offset);
    const limitIdx = queryArgs.length - 1;
    const offsetIdx = queryArgs.length;

    const dataResult = await db.query(
      `SELECT user_id as id, user_id, username, role, stall_id, display_name, created_at, is_active, updated_at 
       FROM users ${whereString} 
       ORDER BY created_at DESC 
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      queryArgs
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { username, password, role, is_active = true, stall_ids = [] } = req.body;

  if (!username || !password || !role) {
    res.status(400).json({ error: 'Username, password e role são obrigatórios.' });
    return;
  }

  try {
    await db.query('BEGIN');

    // Duplicate check
    const dupCheck = await db.query('SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    if (dupCheck.rows.length > 0) {
      await db.query('ROLLBACK');
      res.status(409).json({ error: 'Username já está em uso.' });
      return;
    }

    const password_hash = bcrypt.hashSync(password, 12);
    // Since display_name is required in the DB schema, we use username as fallback
    const display_name = req.body.display_name || username;

    const insertResult = await db.query(
      `INSERT INTO users (username, password_hash, role, display_name, is_active, updated_at) 
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
      [username, password_hash, role, display_name, is_active]
    );

    const newUser = insertResult.rows[0];

    for (const stallId of stall_ids) {
      await db.query(
        'INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)',
        [stallId, newUser.user_id]
      );
    }

    await db.query('COMMIT');
    res.json({ data: stripPassword(newUser), message: 'Usuário criado com sucesso.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const user = userResult.rows[0];
    
    // Fetch related stalls
    const stallResult = await db.query('SELECT stall_id FROM stall_users WHERE user_id = $1', [id]);
    const stalls = stallResult.rows.map((r: any) => r.stall_id);

    res.json({ data: { ...stripPassword(user), stall_ids: stalls } });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { username, password, role, is_active, stall_ids = [] } = req.body;

  if (!username || !role) {
    res.status(400).json({ error: 'Username e role são obrigatórios.' });
    return;
  }

  try {
    await db.query('BEGIN');

    // Duplicate check
    const dupCheck = await db.query('SELECT user_id FROM users WHERE LOWER(username) = LOWER($1) AND user_id != $2', [username, id]);
    if (dupCheck.rows.length > 0) {
      await db.query('ROLLBACK');
      res.status(409).json({ error: 'Username já está em uso.' });
      return;
    }

    let query = '';
    let queryArgs = [];

    const display_name = req.body.display_name || username;

    if (password) {
      const password_hash = bcrypt.hashSync(password, 12);
      query = `UPDATE users SET username = $1, password_hash = $2, role = $3, display_name = $4, is_active = $5, updated_at = now() WHERE user_id = $6 RETURNING *`;
      queryArgs = [username, password_hash, role, display_name, is_active, id];
    } else {
      query = `UPDATE users SET username = $1, role = $2, display_name = $3, is_active = $4, updated_at = now() WHERE user_id = $5 RETURNING *`;
      queryArgs = [username, role, display_name, is_active, id];
    }

    const updateResult = await db.query(query, queryArgs);
    
    if (updateResult.rows.length === 0) {
      await db.query('ROLLBACK');
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const updatedUser = updateResult.rows[0];

    // Sync stall_users
    await db.query('DELETE FROM stall_users WHERE user_id = $1', [id]);
    for (const stallId of stall_ids) {
      await db.query(
        'INSERT INTO stall_users (stall_id, user_id) VALUES ($1, $2)',
        [stallId, id]
      );
    }

    await db.query('COMMIT');
    res.json({ data: stripPassword(updatedUser), message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    // We can do a smart toggle if we don't pass is_active, but standard is fetching and flipping or passing it
    const userResult = await db.query('SELECT is_active FROM users WHERE user_id = $1', [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const currentStatus = userResult.rows[0].is_active;
    const newStatus = !currentStatus;

    const updateResult = await db.query(
      'UPDATE users SET is_active = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      [newStatus, id]
    );

    res.json({ data: stripPassword(updateResult.rows[0]), message: 'Status atualizado com sucesso.' });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    // Verificação de vínculos na tabela stall_users
    const linkCheck = await db.query('SELECT COUNT(*) FROM stall_users WHERE user_id = $1', [id]);
    const count = parseInt(linkCheck.rows[0].count, 10);

    if (count > 0) {
      res.status(409).json({ error: 'Não é possível excluir usuário com barracas vinculadas. Desative o usuário em vez de excluí-lo.' });
      return;
    }

    const deleteResult = await db.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [id]);
    
    if (deleteResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
