import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { db } from '../db';
import { ProductRepository } from '../repositories';
import { ProductService } from '../services';
import { AuthUser } from '../types/db';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const productRepo = new ProductRepository(db);
const productService = new ProductService(productRepo);

// GET /api/products
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const is_active = req.query.is_active as string;
    const stall_id = req.query.stall_id as string;
    const parent_type = req.query.parent_type as string;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);

    const isActiveBool = is_active !== undefined ? (is_active === 'true') : undefined;

    const result = await productService.listProducts({
      search,
      isActive: isActiveBool,
      stallId: stall_id,
      category: parent_type,
      page,
      limit
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, stall_id, category_id, price, is_active = true } = req.body;

  try {
    const created = await productService.createProduct({
      name,
      stallId: stall_id,
      categoryId: category_id,
      price,
      isActive: is_active
    }, req.user as AuthUser);

    res.json({ data: created, message: 'Produto criado.' });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const data = await productService.getProductById(id);
    res.json({ data });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, stall_id, category_id, price, is_active = true } = req.body;

  try {
    const updated = await productService.updateProduct(id, {
      name,
      stallId: stall_id,
      categoryId: category_id,
      price,
      isActive: is_active
    }, req.user as AuthUser);

    res.json({ data: updated, message: 'Produto atualizado.' });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /api/products/:id/status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const updated = await productService.toggleProductStatus(id, req.user as AuthUser);
    res.json({ data: updated, message: 'Status atualizado.' });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error patching product:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await productService.deleteProduct(id, req.user as AuthUser);
    res.json({ message: 'Produto excluído.' });
  } catch (err: any) {
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
