const express = require('express');
const { state } = require('../db');
const { checkPassword, signToken } = require('../auth');
const { requireAuth } = require('../middleware');

const router = express.Router();

// POST /api/auth/login { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  const user = state.users.find(u => u.username === username);
  if (!user || !checkPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      stallId: user.stallId,
      displayName: user.displayName
    }
  });
});

// GET /api/auth/me -> valida o token salvo e devolve os dados do usuário,
// usado para manter a sessão ao recarregar a página.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
