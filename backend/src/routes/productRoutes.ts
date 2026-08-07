import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware';
import { broadcastState } from '../socket';
import { logAudit } from '../audit';

const router = Router();

// POST /api/products/:id/production { amount }
// Só a barraca dona do produto pode registrar produção nova (reabastecimento).
router.post('/products/:id/production', requireAuth, requireRole('stall', 'operator'),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const amount = Number(req.body?.amount);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Quantidade de produção inválida.' });
    }

    try {
      const productRes = await db.query('SELECT * FROM products WHERE product_id = $1', [id]);
      
      if (productRes.rows.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      const product = productRes.rows[0];
      
      if ((req.user!.role === 'stall' || req.user!.role === 'operator') && product.stall_id !== req.user!.stallId) {
        return res.status(403).json({ error: 'Esse produto não pertence à sua barraca.' });
      }

      const before = { stock: product.stock };
      const updated = await db.query(
        'UPDATE products SET stock = LEAST(max_stock, stock + $1) WHERE product_id = $2 RETURNING *',
        [amount, id]
      );
      const after = { stock: updated.rows[0].stock };

      logAudit({ 
        userId: req.user!.sub, 
        action: 'PRODUCT_STOCK_UPDATED', 
        entityType: 'products', 
        entityId: id, 
        before, 
        after 
      });
      
      broadcastState();
      res.json({ product: updated.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno ao atualizar estoque.' });
    }
  }
);

// POST /api/stalls/:stallId/reset
// Restaura o estoque apenas dos produtos daquela barraca para 0
router.post('/stalls/:stallId/reset', requireAuth, requireRole('stall', 'operator', 'admin'),
  async (req: Request, res: Response) => {
    const { stallId } = req.params;
    
    if ((req.user!.role === 'stall' || req.user!.role === 'operator') && req.user!.stallId !== stallId) {
      return res.status(403).json({ error: 'Você só pode redefinir sua própria barraca.' });
    }

    try {
      await db.query('UPDATE products SET stock = 0 WHERE stall_id = $1', [stallId]);
      
      logAudit({ 
        userId: req.user!.sub, 
        action: 'STALL_STOCK_RESET', 
        entityType: 'stalls', 
        entityId: stallId, 
        before: null, 
        after: { stock: 0 } 
      });
      
      broadcastState();

      const productsRes = await db.query('SELECT * FROM products WHERE stall_id = $1 ORDER BY name', [stallId]);
      res.json({ products: productsRes.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno ao resetar estoque.' });
    }
  }
);

export default router;