import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { db } from '../db';
import { CategoryRepository, ProductRepository } from '../repositories';
import { CategoryService } from '../services';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const categoryRepo = new CategoryRepository(db);
const productRepo = new ProductRepository(db);
const categoryService = new CategoryService(categoryRepo, productRepo);

// GET /api/product-categories
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parentType = req.query.parent_type as string;
    const data = await categoryService.listCategories(parentType);
    res.json({ data });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/product-categories
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, parent_type } = req.body;

  try {
    const created = await categoryService.createCategory(name, parent_type);
    res.json({ data: created, message: 'Subcategoria criada.' });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/product-categories/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await categoryService.deleteCategory(id);
    res.json({ message: 'Subcategoria excluída com sucesso.' });
  } catch (err: any) {
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
