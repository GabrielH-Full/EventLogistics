const { verifyToken } = require('./auth');

// Exige um Bearer token válido. Popula req.user com { sub, username, role, stallId, displayName }.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token ausente. Faça login novamente.' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }
}

// Exige que o usuário autenticado tenha um dos papéis informados ('admin' | 'stall').
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sua conta não tem permissão para essa ação.' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
