import { randomUUID } from 'crypto';
import { ProductRepository } from '../repositories';
import { logAudit } from '../audit';
import { broadcastState } from '../socket';
import { 
  CreateProductInput, 
  UpdateProductInput, 
  ProductFilters, 
  AuthUser 
} from '../types/db';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    private auditLogger: typeof logAudit = logAudit,
    private broadcast: typeof broadcastState = broadcastState
  ) {}

  async listProducts(filters: ProductFilters = {}): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { rows, total } = await this.productRepo.findAll(filters);
    return { data: rows, total, page, limit };
  }

  async getProductById(id: string): Promise<any> {
    const product = await this.productRepo.findByIdWithDetails(id);
    if (!product) {
      throw new NotFoundError('Produto não encontrado.');
    }
    return product;
  }

  async createProduct(input: CreateProductInput, user: AuthUser): Promise<any> {
    if (!input.name || !input.stallId || !input.categoryId || input.price === undefined) {
      throw new ValidationError('Campos name, stall_id, category_id, price são obrigatórios.');
    }

    if (typeof input.price !== 'number' || input.price <= 0 || isNaN(input.price)) {
      throw new ValidationError('Preço inválido — deve ser um número positivo.');
    }

    const productId = input.productId || randomUUID();
    const created = await this.productRepo.create({
      productId,
      stallId: input.stallId,
      categoryId: input.categoryId,
      name: input.name,
      price: input.price,
      isActive: input.isActive ?? true,
      stock: input.stock ?? 0,
      maxStock: input.maxStock ?? 100,
      unit: input.unit ?? 'un',
      image: input.image ?? 'food.png',
      category: input.category ?? 'Salgados'
    });

    await this.auditLogger({
      userId: user.sub,
      action: 'PRODUCT_CREATED',
      entityType: 'products',
      entityId: productId,
      before: null,
      after: created as unknown as Record<string, unknown>
    });

    await this.broadcast();
    return created;
  }

  async updateProduct(id: string, input: UpdateProductInput, user: AuthUser): Promise<any> {
    if (!input.name || !input.stallId || !input.categoryId || input.price === undefined) {
      throw new ValidationError('Campos name, stall_id, category_id, price são obrigatórios.');
    }

    if (typeof input.price !== 'number' || input.price <= 0 || isNaN(input.price)) {
      throw new ValidationError('Preço inválido — deve ser um número positivo.');
    }

    const updated = await this.productRepo.update(id, {
      name: input.name,
      stallId: input.stallId,
      categoryId: input.categoryId,
      price: input.price,
      isActive: input.isActive ?? true
    });

    if (!updated) {
      throw new NotFoundError('Produto não encontrado.');
    }

    await this.auditLogger({
      userId: user.sub,
      action: 'PRODUCT_UPDATED',
      entityType: 'products',
      entityId: id,
      before: null,
      after: updated as unknown as Record<string, unknown>
    });

    await this.broadcast();
    return updated;
  }

  async toggleProductStatus(id: string, user: AuthUser): Promise<any> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundError('Produto não encontrado.');
    }

    const updated = await this.productRepo.toggleStatus(id);
    if (!updated) {
      throw new NotFoundError('Produto não encontrado.');
    }

    await this.auditLogger({
      userId: user.sub,
      action: 'PRODUCT_UPDATED',
      entityType: 'products',
      entityId: id,
      before: { is_active: product.is_active },
      after: updated as unknown as Record<string, unknown>
    });

    await this.broadcast();
    return updated;
  }

  async deleteProduct(id: string, user: AuthUser): Promise<void> {
    const hasHistory = await this.productRepo.hasTicketHistory(id);
    if (hasHistory) {
      throw new ConflictError('Não é possível excluir produto com histórico de vendas (tickets). Desative o produto.');
    }

    const deleted = await this.productRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Produto não encontrado.');
    }

    await this.auditLogger({
      userId: user.sub,
      action: 'PRODUCT_DELETED',
      entityType: 'products',
      entityId: id,
      before: deleted as unknown as Record<string, unknown>,
      after: null
    });

    await this.broadcast();
  }
}
