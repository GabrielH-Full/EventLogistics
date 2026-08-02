import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken } from '../auth';
import { requireAuth } from '../middleware';

const router = Router();

interface LoginBody {
  username?: string;
  password?: string;
}

// POST /api/auth/login { username, password }
// Migrado de state.users (memória) para PostgreSQL (Task 7.0)
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Informe usuário e senha.' });
    return;
  }

  try {
    // Busca no PostgreSQL (case-insensitive via LOWER)
    const result = await db.query(
      `SELECT user_id, username, password_hash, role, stall_id, display_name, is_active
       FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );

    const row = result.rows[0];

    // Usuário não encontrado — mensagem genérica por segurança
    if (!row) {
      res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      return;
    }

    // Conta desativada — mensagem específica
    if (!row.is_active) {
      res.status(401).json({ error: 'Usuário desativado. Fale com um administrador.' });
      return;
    }

    // Verificação de senha com bcrypt (hash armazenado no banco)
    const passwordMatch = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      return;
    }

    // Montar objeto compatível com a interface User e gerar JWT
    const token = signToken({
      id: row.user_id,
      username: row.username,
      passwordHash: row.password_hash, // necessário pela interface User — não incluído no payload do token
      role: row.role,
      stallId: row.stall_id,
      displayName: row.display_name,
    });

    res.json({
      token,
      user: {
        id: row.user_id,
        username: row.username,
        role: row.role,
        stallId: row.stall_id,
        displayName: row.display_name,
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/me → valida o token salvo e devolve os dados do usuário,
// usado para manter a sessão ao recarregar a página.
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;