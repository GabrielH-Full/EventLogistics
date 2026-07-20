import { Router, Request, Response } from 'express';
import { state } from '../db';
import { checkPassword, signToken } from '../auth';
import { requireAuth } from '../middleware';

const router = Router();

interface LoginBody {
  username?: string;
  password?: string;
}

// POST /api/auth/login { username, password }
router.post('/login', (req: Request<{}, {}, LoginBody>, res: Response) => {
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
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;