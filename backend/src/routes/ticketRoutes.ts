import { Router, Request, Response } from 'express';
import { state, save } from '../db';
import { requireAuth, requireRole } from '../middleware';
import { broadcastState } from '../socket';
import { Ticket, TicketItem } from '../types/domain';

const router = Router();

interface SaleItem {
  productId: string;
  quantity: number;
}

interface CreateTicketBody {
  items?: SaleItem[];
}

// POST /api/tickets  { items: [{ productId, quantity }] }
// Só a conta ADM (Caixa Central) vende tickets.
// Regra de negócio central do projeto: a venda só é aceita se TODOS os itens
// tiverem estoque suficiente no momento da venda. Isso é o que impede vender
// ticket de um produto que a barraca já não tem mais.
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  (req: Request<{}, {}, CreateTicketBody>, res: Response) => {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'O carrinho está vazio.' });
    }

    const resolvedItems: { product: (typeof state.products)[number]; quantity: number }[] = [];
    for (const { productId, quantity } of items) {
      const product = state.products.find(p => p.id === productId);
      if (!product) {
        return res.status(404).json({ error: `Produto ${productId} não encontrado.` });
      }
      if (quantity <= 0) {
        return res.status(400).json({ error: `Quantidade inválida para ${product.name}.` });
      }
      if (product.stock < quantity) {
        return res.status(409).json({
          error: `Estoque insuficiente para "${product.name}". Restam apenas ${product.stock}.`,
          productId: product.id,
          available: product.stock
        });
      }
      resolvedItems.push({ product, quantity });
    }

    // Todas as validações passaram: agora sim debita o estoque e cria o ticket.
    const ticketItems: TicketItem[] = resolvedItems.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity
    }));

    resolvedItems.forEach(({ product, quantity }) => {
      product.stock = Math.max(0, product.stock - quantity);
    });

    const total = ticketItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const newTicket: Ticket = {
      id: 'ticket_' + Date.now(),
      code: '#' + Math.floor(8000 + Math.random() * 999),
      items: ticketItems,
      total,
      time: 'Agora',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    state.tickets.unshift(newTicket);
    save();
    broadcastState();

    res.status(201).json({ ticket: newTicket });
  }
);

// POST /api/tickets/:id/validate
// A barraca só pode validar tickets que contenham pelo menos um item dela.
// A conta ADM também pode validar, para dar suporte/fiscalização.
router.post(
  '/:id/validate',
  requireAuth,
  requireRole('admin', 'stall'),
  (req: Request<{ id: string }>, res: Response) => {
    const ticket = state.tickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    if (req.user!.role === 'stall') {
      const belongsToStall = ticket.items.some(item => {
        const product = state.products.find(p => p.id === item.productId);
        return product && product.stallId === req.user!.stallId;
      });
      if (!belongsToStall) {
        return res.status(403).json({ error: 'Esse ticket não pertence à sua barraca.' });
      }
    }

    ticket.status = 'validated';
    ticket.time = 'Agora mesmo';
    save();
    broadcastState();

    res.json({ ticket });
  }
);

export default router;