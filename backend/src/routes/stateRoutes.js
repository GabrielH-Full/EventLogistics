const express = require('express');
const { publicState } = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

// GET /api/state -> snapshot atual usado no carregamento inicial da tela.
// As atualizações seguintes chegam via WebSocket (state:update).
router.get('/', requireAuth, (req, res) => {
  res.json(publicState());
});

module.exports = router;
