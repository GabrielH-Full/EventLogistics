import { Router, Request, Response } from 'express';
import { db } from '../db';
import { ProductRepository } from '../repositories';
import { InventoryService } from '../services';
import { requireAuth, requireRole } from '../middleware';
import { AuthUser } from '../types/db';
import { 
  NotFoundError, 
  ForbiddenError, 
  ValidationError 
} from '../errors/DomainErrors';

const router = Router();

const productRepo = new ProductRepository(db);
const inventoryService = new InventoryService(productRepo);

// POST /api/products/:id/production { amount }
// Só a barraca dona do produto pode registrar produção nova (reabastecimento).
router.post(
  '/products/:id/production',
  requireAuth,
  requireRole('stall', 'operator'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const amount = Number(req.body?.amount);

    try {
      const product = await inventoryService.addProduction(id, amount, req.user as AuthUser);
      res.json({ product });
    } catch (err: any) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof ForbiddenError) {
        res.status(403).json({ error: err.message });
        return;
      }
      console.error('[ProductRoutes /production] Erro:', err);
      res.status(500).json({ error: 'Erro interno ao atualizar estoque.' });
    }
  }
);

// POST /api/stalls/:stallId/reset
// Restaura o estoque apenas dos produtos daquela barraca para 0
router.post(
  '/stalls/:stallId/reset',
  requireAuth,
  requireRole('stall', 'operator', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    const { stallId } = req.params;

    try {
      const products = await inventoryService.resetStallStock(stallId, req.user as AuthUser);
      res.json({ products });
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        res.status(403).json({ error: err.message });
        return;
      }
      console.error('[ProductRoutes /reset] Erro:', err);
      res.status(500).json({ error: 'Erro interno ao resetar estoque.' });
    }
  }
);

export default router;
