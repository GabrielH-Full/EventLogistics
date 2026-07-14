const express = require('express');
const { state, save } = require('../db');
const { requireAuth, requireRole } = require('../middleware');
const { broadcastState } = require('../socket');
const { buildInitialState } = require('../seedData');

const router = express.Router();

function assertOwnsProduct(req, res, product) {
  if (!product) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return false;
  }
  if (req.user.role === 'stall' && product.stallId !== req.user.stallId) {
    res.status(403).json({ error: 'Esse produto não pertence à sua barraca.' });
    return false;
  }
  return true;
}

// POST /api/products/:id/production { amount }
// Só a barraca dona do produto pode registrar produção nova (reabastecimento).
router.post('/products/:id/production', requireAuth, requireRole('stall'), (req, res) => {
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
});

// POST /api/stalls/:stallId/reset
// Restaura o estoque apenas dos produtos daquela barraca para os valores
// iniciais de demonstração (não mexe nas outras barracas nem nos tickets).
router.post('/stalls/:stallId/reset', requireAuth, requireRole('stall', 'admin'), (req, res) => {
  const { stallId } = req.params;
  if (req.user.role === 'stall' && req.user.stallId !== stallId) {
    return res.status(403).json({ error: 'Você só pode redefinir sua própria barraca.' });
  }

  const seed = buildInitialState();
  state.products = state.products.map(p => {
    if (p.stallId !== stallId) return p;
    const seedProduct = seed.products.find(sp => sp.id === p.id);
    return seedProduct ? { ...p, stock: seedProduct.stock } : p;
  });

  save();
  broadcastState();

  res.json({ products: state.products.filter(p => p.stallId === stallId) });
});

module.exports = router;
