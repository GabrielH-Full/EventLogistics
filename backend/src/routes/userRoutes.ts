import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { db } from '../db';
import { UserRepository } from '../repositories';
import { UserService } from '../services';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const userRepo = new UserRepository(db);
const userService = new UserService(db, userRepo);

// GET /api/users
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const isActive = req.query.is_active as string;
    const role = req.query.role as any;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);

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
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  try {
    const user = await userService.getUserById(id);
    res.json({ data: user });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  try {
    const updated = await userService.toggleUserStatus(id);
    res.json({ data: updated, message: 'Status atualizado com sucesso.' });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  try {
    await userService.deleteUser(id);
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
