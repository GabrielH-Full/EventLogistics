export type Role = 'admin' | 'stall';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  stallId: string | null;
  displayName: string;
}

// Payload que vai dentro do JWT (nunca inclui passwordHash)
export interface TokenPayload {
  sub: string;
  username: string;
  role: Role;
  stallId: string | null;
  displayName: string;
}

// Estende o Request do Express para incluir req.user após requireAuth
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}