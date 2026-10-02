import { ProductRepository } from '../repositories';
import { logAudit } from '../audit';
import { broadcastState } from '../socket';
import { AuthUser, ProductDTO } from '../types/db';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/DomainErrors';

export class InventoryService {
  constructor(
    private productRepo: ProductRepository,
    private auditLogger: typeof logAudit = logAudit,
    private broadcast: typeof broadcastState = broadcastState
  ) {}

  private assertStallOwnership(targetStallId: string, user: AuthUser): void {
    const isStallOrOperator = user.role === 'stall' || user.role === 'operator';
    if (isStallOrOperator && user.stallId !== targetStallId) {
      throw new ForbiddenError('Acesso não autorizado para esta barraca.');
    }
  }

  /**
   * Caso de uso: Registrar produção / reabastecimento de estoque
   * - Verifica existência do produto
   * - Checa ownership de barraca
   * - Incrementa estoque respeitando max_stock
   * - Audit log e broadcast
   */
  async addProduction(productId: string, amount: number, user: AuthUser): Promise<ProductDTO> {
    if (!amount || amount <= 0) {
      throw new ValidationError('Quantidade de produção inválida.');
    }

    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new NotFoundError('Produto não encontrado.');
    }

    this.assertStallOwnership(product.stall_id, user);

    const before = { stock: product.stock };
    const updated = await this.productRepo.incrementStockWithLimit(productId, amount);
    if (!updated) {
      throw new NotFoundError('Erro ao atualizar produto.');
    }

    const after = { stock: updated.stock };

    await this.auditLogger({
      userId: user.sub,
      action: 'PRODUCT_STOCK_UPDATED',
      entityType: 'products',
      entityId: productId,
      before,
      after
    });

    await this.broadcast();

    return {
      id: updated.product_id,
      name: updated.name,
      category: updated.category,
      categoryId: updated.category_id,
      price: Number(updated.price),
      stock: updated.stock,
      maxStock: updated.max_stock,
      unit: updated.unit,
      image: updated.image || undefined,
      stallId: updated.stall_id,
      isActive: updated.is_active
    };
  }

  /**
   * Caso de uso: Resetar estoque da barraca para 0
   * - Checa ownership de barraca
   * - Zera estoque de todos os produtos da barraca
   * - Audit log e broadcast
   */
  async resetStallStock(stallId: string, user: AuthUser): Promise<ProductDTO[]> {
    this.assertStallOwnership(stallId, user);

    const updatedRows = await this.productRepo.resetStockByStall(stallId);

    await this.auditLogger({
      userId: user.sub,
      action: 'STALL_STOCK_RESET',
      entityType: 'stalls',
      entityId: stallId,
      before: null,
      after: { stock: 0 }
    });

    await this.broadcast();

    return updatedRows.map(row => ({
      id: row.product_id,
      name: row.name,
      category: row.category,
      categoryId: row.category_id,
      price: Number(row.price),
      stock: row.stock,
      maxStock: row.max_stock,
      unit: row.unit,
      image: row.image || undefined,
      stallId: row.stall_id,
      isActive: row.is_active
    }));
  }
}
