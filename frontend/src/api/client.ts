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

  validateStallTicket: (items: { productId: string; quantity: number; unitPrice: number }[]) =>
    request<{ success: boolean; ticketId: string }>('/api/tickets/validate', { method: 'POST', body: JSON.stringify({ items }) }),

  revertTicket: (ticketId: string) =>
    request<{ success: boolean }>(`/api/tickets/${ticketId}/revert`, { method: 'POST' }),

  addProduction: (productId: string, amount: number) =>
    request<{ product: any }>(`/api/products/${productId}/production`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  resetStallStock: (stallId: string) =>
    request<{ products: any[] }>(`/api/stalls/${stallId}/reset`, { method: 'POST' }),

  // CRUD Admin - Users
  getUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/api/users${qs}`);
  },
  createUser: (body: any) => request<any>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: number | string, body: any) => request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleUserStatus: (id: number | string) => request<void>(`/api/users/${id}/status`, { method: 'PATCH' }),
  deleteUser: (id: number | string) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),

  // CRUD Admin - Stalls
  getStalls: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/api/stalls${qs}`);
  },
  createStall: (body: any) => request<any>('/api/stalls', { method: 'POST', body: JSON.stringify(body) }),
  updateStall: (id: number | string, body: any) => request<any>(`/api/stalls/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleStallStatus: (id: number | string) => request<void>(`/api/stalls/${id}/status`, { method: 'PATCH' }),
  deleteStall: (id: number | string) => request<void>(`/api/stalls/${id}`, { method: 'DELETE' }),

  // CRUD Admin - Products
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/api/products${qs}`);
  },
  createProduct: (body: any) => request<any>('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: number | string, body: any) => request<any>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleProductStatus: (id: number | string) => request<void>(`/api/products/${id}/status`, { method: 'PATCH' }),
  deleteProduct: (id: number | string) => request<void>(`/api/products/${id}`, { method: 'DELETE' }),

  // CRUD Admin - Product Categories
  getProductCategories: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[] }>(`/api/product-categories${qs}`);
  },
  createProductCategory: (body: any) => request<any>('/api/product-categories', { method: 'POST', body: JSON.stringify(body) }),
  deleteProductCategory: (id: number | string) => request<void>(`/api/product-categories/${id}`, { method: 'DELETE' }),
};
