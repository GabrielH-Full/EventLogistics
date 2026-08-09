import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { db } from './db';
import { Role } from './types/auth';

/**
 * Exige um Bearer token válido E que o usuário ainda esteja ativo no banco.
 * Zero Trust: "nunca confiar, sempre verificar" — a assinatura JWT é checada
 * e, em seguida, confirmamos is_active no banco para invalidação imediata de
 * contas desativadas (sem esperar o JWT expirar).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Token ausente. Faça login novamente.' });
    return;
  }

  // 1ª verificação: assinatura e expiração do JWT (rápido, sem I/O)
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    return;
  }

  // 2ª verificação Zero Trust: is_active no banco (~1-2ms overhead)
  // Garante que contas desativadas percam acesso imediatamente.
  try {
    const result = await db.query(
      'SELECT is_active FROM users WHERE user_id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      res.status(401).json({ error: 'Conta desativada ou não encontrada. Faça login novamente.' });
      return;
    }
  } catch {
    // Falha ao consultar o banco — nega acesso por segurança (fail-closed)
    res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    return;
  }

  req.user = payload;
  next();
}

// Exige que o usuário autenticado tenha um dos papéis informados ('admin' | 'stall' | 'operator').
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