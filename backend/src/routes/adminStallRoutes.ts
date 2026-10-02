import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { db } from '../db';
import { StallRepository, ProductRepository } from '../repositories';
import { StallService } from '../services';
import { AuthUser } from '../types/db';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const stallRepo = new StallRepository(db);
const productRepo = new ProductRepository(db);
const stallService = new StallService(db, stallRepo, productRepo);

// GET /api/stalls
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const is_active = req.query.is_active as string;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);

    const isActiveBool = is_active !== undefined ? (is_active === 'true') : undefined;

    const result = await stallService.listStalls({
      search,
      isActive: isActiveBool,
      page,
      limit
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching stalls:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/stalls
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, type, is_active = true, user_ids = [], icon = 'Store' } = req.body;

  try {
    const newStall = await stallService.createStall({
      name,
      type,
      isActive: is_active,
      userIds: user_ids,
      icon
    }, req.user as AuthUser);

    res.json({ data: newStall, message: 'Barraca criada.' });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error creating stall:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/stalls/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const data = await stallService.getStallById(id);
    res.json({ data });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error fetching stall:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/stalls/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, type, is_active, user_ids = [], icon = 'Store' } = req.body;

  try {
    const updated = await stallService.updateStall(id, {
      name,
      type,
      isActive: is_active,
      userIds: user_ids,
      icon
    }, req.user as AuthUser);

    res.json({ data: updated, message: 'Barraca atualizada.' });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error updating stall:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /api/stalls/:id/status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const updated = await stallService.toggleStallStatus(id, req.user as AuthUser);
    res.json({ data: updated, message: 'Status atualizado.' });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error patching stall:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/stalls/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await stallService.deleteStall(id, req.user as AuthUser);
    res.json({ message: 'Barraca excluída.' });
  } catch (err: any) {
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error deleting stall:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
