import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { db } from '../db';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// GET /api/product-categories
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parentType = req.query.parent_type as string;
    
    let query = 'SELECT category_id as id, * FROM product_categories';
    let params: any[] = [];
    
    if (parentType === 'food' || parentType === 'drink') {
      query += ' WHERE parent_type = $1';
      params.push(parentType);
    }

    query += ' ORDER BY name ASC';
    
    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/product-categories
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, parent_type } = req.body;
  if (!name || (parent_type !== 'food' && parent_type !== 'drink')) {
    res.status(400).json({ error: 'Campos name e parent_type (food|drink) são obrigatórios.' });
    return;
  }
  try {
    const result = await db.query(
      'INSERT INTO product_categories (name, parent_type) VALUES ($1, $2) RETURNING *',
      [name, parent_type]
    );
    res.json({ data: result.rows[0], message: 'Subcategoria criada.' });
  } catch (err: any) {
    if (err.code === '23505') { // UNIQUE constraint
      res.status(409).json({ error: 'Já existe uma categoria com este nome neste tipo.' });
    } else {
      console.error('Error creating category:', err);
      res.status(500).json({ error: 'Erro interno.' });
    }
  }
});

// DELETE /api/product-categories/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    // Verificando produtos associados
    const countCheck = await db.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
    if (parseInt(countCheck.rows[0].count, 10) > 0) {
      res.status(409).json({ error: 'Não é possível excluir subcategoria contendo produtos vinculados.' });
      return;
    }

    const result = await db.query('DELETE FROM product_categories WHERE category_id = $1 RETURNING category_id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Subcategoria não encontrada.' });
      return;
    }
    res.json({ message: 'Subcategoria excluída com sucesso.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
