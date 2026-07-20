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

export type TicketStatus = 'pending' | 'validated';

export interface Ticket {
  id: string;
  code: string;
  items: TicketItem[];
  total: number;
  time: string;
  timestamp: string;
  status: TicketStatus;
}

export interface AppState {
  users: import('./auth').User[];
  products: Product[];
  stalls: Stall[];
  tickets: Ticket[];
}