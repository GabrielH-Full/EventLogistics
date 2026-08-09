import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, TokenPayload } from './types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_troque_em_producao';
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('[FATAL] JWT_SECRET não configurado ou inseguro. Encerrando.');
  process.exit(1); // Fail Closed
}
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '12h') as SignOptions['expiresIn'];

export function checkPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(user: User): string {
  // Nunca colocamos passwordHash no token.
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    stallId: user.stallId,
    displayName: user.displayName
  };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}