import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { Role } from './types/auth';

// Exige um Bearer token válido. Popula req.user com { sub, username, role, stallId, displayName }.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Token ausente. Faça login novamente.' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }
}

// Exige que o usuário autenticado tenha um dos papéis informados ('admin' | 'stall').
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Sua conta não tem permissão para essa ação.' });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');