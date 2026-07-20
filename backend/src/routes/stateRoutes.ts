import { Router, Request, Response } from 'express';
const { publicState } = require('../db');
const { requireAuth } = require('../middleware');

const router = Router();

// GET /api/state -> snapshot atual usado no carregamento inicial da tela.
// As atualizações seguintes chegam via WebSocket (state:update).
router.get('/', requireAuth, (req: Request, res: Response) => {
  res.json(publicState());
});

export default router;