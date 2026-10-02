export type TicketStatus = 'pending' | 'validated' | 'reverted';
export type UserRole = 'admin' | 'stall' | 'operator';

export interface TicketRow {
  ticket_id: string;
  code: string;
  total: number | string;
  status: TicketStatus;
  operator_id?: number | string | null;
  stall_id?: string | null;
  created_at: Date;
}

export interface ProductRow {
  product_id: string;
  name: string;
  category: string;
  category_id?: string | null;
  price: number | string;
  stock: number;
  max_stock: number;
  unit: string;
  image?: string | null;
  stall_id: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TicketItemRow {
  ticket_item_id?: number;
  ticket_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | string;
  name?: string;
  category?: string;
}

export interface UserRow {
  user_id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface StallRow {
  stall_id: string;
  name: string;
  icon?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface StallUserRow {
  stall_id: string;
  user_id: number;
  created_at?: Date;
}

export interface ProductCategoryRow {
  category_id: string;
  stall_id: string;
  name: string;
  display_order?: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// DTOs & Domain Entities
export interface TicketItemDTO {
  productId: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
}

export interface TicketDTO {
  id: string;
  code: string;
  total: number;
  status: TicketStatus;
  timestamp?: string | Date;
  time?: string;
  operatorId?: number | string | null;
  stallId?: string | null;
  items: TicketItemDTO[];
}

export interface ProductDTO {
  id: string;
  name: string;
  category: string;
  categoryId?: string | null;
  price: number;
  stock: number;
  maxStock: number;
  unit: string;
  image?: string;
  stallId: string;
  isActive: boolean;
}

export interface StallDTO {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  userIds?: number[];
}

export interface UserDTO {
  id: number;
  username: string;
  role: UserRole;
  isActive: boolean;
  stalls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleItem {
  productId: string;
  quantity: number;
}

export interface CreateTicketInput {
  ticketId: string;
  code: string;
  total: number;
  operatorId?: number | string | null;
  stallId?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CreateProductInput {
  productId?: string;
  name: string;
  category?: string;
  categoryId?: string | null;
  price: number;
  stock?: number;
  maxStock?: number;
  unit?: string;
  image?: string;
  stallId: string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  categoryId?: string | null;
  price?: number;
  stock?: number;
  maxStock?: number;
  unit?: string;
  image?: string;
  stallId?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  stallId?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateStallInput {
  stallId?: string;
  name: string;
  icon?: string;
  isActive?: boolean;
  userIds?: number[];
}

export interface UpdateStallInput {
  name?: string;
  icon?: string;
  isActive?: boolean;
  userIds?: number[];
}

export interface StallFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateUserInput {
  username: string;
  password?: string;
  role: UserRole;
  isActive?: boolean;
  stallIds?: string[];
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  stallIds?: string[];
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthUser {
  sub: string;
  username?: string;
  role: UserRole | string;
  stallId?: string | null;
  displayName?: string;
}
