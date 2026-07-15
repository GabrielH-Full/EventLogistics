export interface Product {
  id: string;
  name: string;
  category: 'Salgados' | 'Doces' | 'Bebidas';
  price: number;
  stock: number;
  maxStock: number;
  unit: string;
  image?: string;
  stallId: string;
}

export interface Stall {
  id: string;
  name: string;
  icon: 'bakery_dining' | 'outdoor_grill' | 'local_candy';
}

export interface TicketItem {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface Ticket {
  id: string;
  code: string;
  items: TicketItem[];
  total: number;
  time: string; // e.g. "Agora", "3 min atrás"
  timestamp: string; // ISO string vindo do backend
  status: 'pending' | 'validated';
}

export type UserRole = 'admin' | 'stall';

export interface AuthUser {
  sub: string;
  username: string;
  role: UserRole;
  stallId: string | null;
  displayName: string;
}
