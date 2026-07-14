const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_troque_em_producao';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function checkPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signToken(user) {
  // Nunca colocamos passwordHash no token.
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    stallId: user.stallId,
    displayName: user.displayName
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { checkPassword, signToken, verifyToken };
