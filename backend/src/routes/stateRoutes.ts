import { Router, Request, Response } from 'express';
import { fetchPublicState } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

// GET /api/state — snapshot atual usado no carregamento inicial da tela.
// As atualizacoes seguintes chegam via WebSocket (state:update).
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const state = await fetchPublicState();
    res.json(state);
  } catch (err) {
    console.error('Erro ao buscar estado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar estado.' });
  }
});

export default router;