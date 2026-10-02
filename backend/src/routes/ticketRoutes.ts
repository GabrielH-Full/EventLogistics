import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { TicketRepository, ProductRepository } from '../repositories';
import { TicketService } from '../services';
import { requireAuth, requireRole } from '../middleware';
import { AuthUser, SaleItem } from '../types/db';
import { 
  InsufficientStockError, 
  NotFoundError, 
  ForbiddenError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

const router = Router();

const ticketRepo = new TicketRepository(db);
const productRepo = new ProductRepository(db);
const ticketService = new TicketService(db, ticketRepo, productRepo);

interface CreateTicketBody {
  items?: SaleItem[];
}

// POST /api/tickets  { items: [{ productId, quantity }] }
// Só a conta ADM (Caixa Central) vende tickets.
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req: Request<{}, {}, CreateTicketBody>, res: Response): Promise<void> => {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'O carrinho está vazio.' });
      return;
    }

    try {
      const ticket = await ticketService.createTicket(items, req.user!.sub);
      res.status(201).json({ ticket });
    } catch (err: any) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof InsufficientStockError) {
        res.status(409).json({
          error: err.message,
          productId: err.productId,
          available: err.available
        });
        return;
      }
      if (err instanceof ForbiddenError) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      console.error('[TicketRoutes POST /] Erro:', err);
      res.status(500).json({ error: 'Erro interno ao criar ticket.' });
    }
  }
);

// POST /api/tickets/validate (Validação direta de itens na barraca)
router.post(
  '/validate',
  requireAuth,
  requireRole('admin', 'operator', 'stall'),
  async (req: Request<{}, {}, { items: any[] }>, res: Response): Promise<void> => {
    const { items } = req.body;
    const stallId = req.user!.stallId;
    const operatorId = Number(req.user!.sub);

    if (!stallId) {
      res.status(403).json({ error: 'Operador não associado a uma barraca.' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'O carrinho está vazio.' });
      return;
    }

    const ticketId = randomUUID();

    try {
      await ticketService.validateDirectSell(ticketId, stallId, operatorId, items);
      res.status(201).json({ success: true, ticketId });
    } catch (err: any) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof InsufficientStockError) {
        res.status(409).json({ error: err.message, productId: err.productId, available: err.available });
        return;
      }
      console.error('[TicketRoutes POST /validate] Erro:', err);
      res.status(400).json({ error: err.message || 'Erro ao validar ticket.' });
    }
  }
);

// POST /api/tickets/:id/validate
// A barraca só pode validar tickets que contenham pelo menos um item dela.
router.post(
  '/:id/validate',
  requireAuth,
  requireRole('admin', 'stall', 'operator'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const ticket = await ticketService.validateTicket(id, req.user as AuthUser);
      res.json({ ticket });
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof ForbiddenError) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      console.error('[TicketRoutes POST /:id/validate] Erro:', err);
      res.status(500).json({ error: 'Erro interno ao validar ticket.' });
    }
  }
);

// POST /api/tickets/:id/revert
router.post(
  '/:id/revert',
  requireAuth,
  requireRole('admin', 'operator', 'stall'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    const stallId = req.user!.stallId;

    if (!stallId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Operador não associado a uma barraca.' });
      return;
    }

    try {
      await ticketService.revertTicket(id, req.user as AuthUser);
      res.status(200).json({ success: true, ticketId: id });
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof ForbiddenError) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      console.error('[TicketRoutes POST /:id/revert] Erro:', err);
      res.status(400).json({ error: err.message || 'Erro ao reverter ticket.' });
    }
  }
);

export default router;
