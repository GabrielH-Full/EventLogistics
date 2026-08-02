import { Router, Request, Response } from 'express';
import { state, save } from '../db';
import { requireAuth, requireRole } from '../middleware';
import { broadcastState } from '../socket';
import { buildInitialState } from '../seedData';
import { Product } from '../types/domain';

const router = Router();

function assertOwnsProduct(req: Request, res: Response, product: Product | undefined): product is Product {
  if (!product) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return false;
  }
  if ((req.user!.role === 'stall' || req.user!.role === 'operator') && product.stallId !== req.user!.stallId) {
    res.status(403).json({ error: 'Esse produto não pertence à sua barraca.' });
    return false;
  }
  return true;
}

interface ProductionBody {
  amount?: number | string;
}

// POST /api/products/:id/production { amount }
// Só a barraca dona do produto pode registrar produção nova (reabastecimento).
router.post(
  '/products/:id/production',
  requireAuth,
  requireRole('stall', 'operator'),
  (req: Request<{ id: string }, {}, ProductionBody>, res: Response) => {
    const product = state.products.find(p => p.id === req.params.id);
    if (!assertOwnsProduct(req, res, product)) return;

    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Quantidade de produção inválida.' });
    }

    product.stock = Math.min(product.maxStock, product.stock + amount);
    save();
    broadcastState();

    res.json({ product });
  }
);

// POST /api/stalls/:stallId/reset
// Restaura o estoque apenas dos produtos daquela barraca para os valores
// iniciais de demonstração (não mexe nas outras barracas nem nos tickets).
router.post(
  '/stalls/:stallId/reset',
  requireAuth,
  requireRole('stall', 'operator', 'admin'),
  (req: Request<{ stallId: string }>, res: Response) => {
    const { stallId } = req.params;
    if ((req.user!.role === 'stall' || req.user!.role === 'operator') && req.user!.stallId !== stallId) {
      return res.status(403).json({ error: 'Você só pode redefinir sua própria barraca.' });
    }

    const seed = buildInitialState();
    state.products = state.products.map(p => {
      if (p.stallId !== stallId) return p;
      const seedProduct = seed.products.find(sp => sp.id === p.id);
      return { ...p, stock: seedProduct ? seedProduct.stock : 0 };
    });

    save();
    broadcastState();

    res.json({ products: state.products.filter(p => p.stallId === stallId) });
  }
);

export default router;