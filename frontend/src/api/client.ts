// URL base do backend. Em dev, o vite.config.ts faz proxy de /api para o
// servidor Node na porta 4000, então basta usar caminhos relativos.
const BASE_URL = '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem('eventlogistics_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data?.error || 'Erro inesperado ao falar com o servidor.', res.status);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; role: string; stallId: string | null; displayName: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    ),

  me: () => request<{ user: any }>('/api/auth/me'),

  getState: () => request<{ products: any[]; stalls: any[]; tickets: any[] }>('/api/state'),

  createTicket: (items: { productId: string; quantity: number }[]) =>
    request<{ ticket: any }>('/api/tickets', { method: 'POST', body: JSON.stringify({ items }) }),

  validateTicket: (ticketId: string) =>
    request<{ ticket: any }>(`/api/tickets/${ticketId}/validate`, { method: 'POST' }),

  addProduction: (productId: string, amount: number) =>
    request<{ product: any }>(`/api/products/${productId}/production`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  resetStallStock: (stallId: string) =>
    request<{ products: any[] }>(`/api/stalls/${stallId}/reset`, { method: 'POST' })
};
