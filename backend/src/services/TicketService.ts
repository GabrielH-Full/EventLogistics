import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { TicketRepository, ProductRepository } from '../repositories';
import { logAudit } from '../audit';
import { broadcastState, broadcastToStall } from '../socket';
import { 
  SaleItem, 
  TicketDTO, 
  AuthUser, 
  TicketItemDTO,
  CreateTicketInput
} from '../types/db';
import { 
  InsufficientStockError, 
  NotFoundError, 
  ForbiddenError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

export interface DirectValidationItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export class TicketService {
  constructor(
    private pool: Pool,
    private ticketRepo: TicketRepository,
    private productRepo: ProductRepository,
    private auditLogger: typeof logAudit = logAudit,
    private broadcast: typeof broadcastState = broadcastState,
    private broadcastStall: typeof broadcastToStall = broadcastToStall
  ) {}

  /**
   * Caso de uso: Criar ticket (Venda de balcão / Caixa Central)
   * - Valida lista de itens
   * - Trava linhas de produto (SELECT FOR UPDATE)
   * - Verifica estoque de cada item
   * - Debita estoque
   * - Insere ticket + ticket_items atomicamente
   * - Dispara audit log e broadcast
   */
  async createTicket(items: SaleItem[], operatorId: string): Promise<TicketDTO> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('O carrinho está vazio.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const resolvedItems: TicketItemDTO[] = [];
      let total = 0;

      for (const item of items) {
        if (!item.productId || item.quantity <= 0) {
          throw new ValidationError(`Quantidade inválida para o produto ${item.productId || 'desconhecido'}.`);
        }

        const product = await this.productRepo.findByIdForUpdate(item.productId, client);
        if (!product) {
          throw new NotFoundError(`Produto ${item.productId} não encontrado.`);
        }

        const stock = Number(product.stock);
        if (stock < item.quantity) {
          throw new InsufficientStockError(product.name, stock, item.productId);
        }

        const price = Number(product.price);
        resolvedItems.push({
          productId: item.productId,
          name: product.name,
          category: product.category,
          price,
          quantity: item.quantity
        });

        total += price * item.quantity;
        await this.productRepo.decrementStock(item.productId, item.quantity, client);
      }

      const ticketId = randomUUID();
      const code = '#' + Math.floor(8000 + Math.random() * 999);
      const now = new Date();

      const ticketInput: CreateTicketInput = {
        ticketId,
        code,
        total,
        operatorId,
        items: resolvedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price
        }))
      };

      await this.ticketRepo.createWithItems(client, ticketInput);

      await client.query('COMMIT');

      const newTicket: TicketDTO = {
        id: ticketId,
        code,
        items: resolvedItems,
        total,
        time: 'Agora',
        timestamp: now.toISOString(),
        status: 'pending'
      };

      await this.auditLogger({
        userId: operatorId,
        action: 'TICKET_CREATED',
        entityType: 'tickets',
        entityId: ticketId,
        after: newTicket as unknown as Record<string, unknown>
      });

      await this.broadcast();

      return newTicket;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Caso de uso: Validar ticket existente pela barraca / operador
   * - Busca ticket com lock
   * - Verifica permissão da barraca (ticket deve conter itens da barraca)
   * - Atualiza status para 'validated'
   * - Dispara audit log e broadcast
   */
  async validateTicket(ticketId: string, user: AuthUser): Promise<TicketDTO> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const ticket = await this.ticketRepo.findByIdForUpdate(client, ticketId);
      if (!ticket) {
        throw new NotFoundError('Ticket não encontrado.');
      }

      if (ticket.status === 'validated') {
        throw new ConflictError('Ticket já se encontra validado.');
      }

      if (ticket.status === 'reverted') {
        throw new ConflictError('Ticket cancelado/estornado não pode ser validado.');
      }

      const isStallOrOperator = user.role === 'stall' || user.role === 'operator';
      if (isStallOrOperator) {
        if (!user.stallId) {
          throw new ForbiddenError('Operador não associado a uma barraca.');
        }

        const belongsToStall = await this.ticketRepo.hasItemsFromStall(client, ticketId, user.stallId);
        if (!belongsToStall) {
          throw new ForbiddenError('Esse ticket não pertence à sua barraca.');
        }
      }

      const updatedTicket = await this.ticketRepo.updateStatus(client, ticketId, 'validated');
      if (!updatedTicket) {
        throw new NotFoundError('Ticket não encontrado para atualização.');
      }

      await client.query('COMMIT');

      const itemRows = await this.ticketRepo.findItemsByTicketId(ticketId);
      const items: TicketItemDTO[] = itemRows.map(row => ({
        productId: row.product_id,
        name: row.name || '',
        category: row.category,
        price: Number(row.unit_price),
        quantity: row.quantity
      }));

      const ticketToReturn: TicketDTO = {
        id: updatedTicket.ticket_id,
        code: updatedTicket.code,
        items,
        total: Number(updatedTicket.total),
        time: 'Agora mesmo',
        timestamp: updatedTicket.created_at,
        status: updatedTicket.status
      };

      await this.auditLogger({
        userId: user.sub,
        action: 'TICKET_VALIDATED',
        entityType: 'tickets',
        entityId: ticketId,
        before: { status: 'pending' },
        after: { status: 'validated' }
      });

      await this.broadcast();

      return ticketToReturn;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Caso de uso: Reverter ticket validado
   * - Busca ticket com lock
   * - Verifica status 'validated'
   * - Restaura estoque dos itens
   * - Atualiza status para 'reverted'
   * - Dispara audit log e broadcast
   */
  async revertTicket(ticketId: string, user: AuthUser): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const ticket = await this.ticketRepo.findByIdForUpdate(client, ticketId);
      if (!ticket) {
        throw new NotFoundError(`Ticket ${ticketId} não encontrado.`);
      }

      if (ticket.status !== 'validated') {
        throw new ConflictError(`Ticket ${ticketId} não pode ser revertido (status atual: ${ticket.status}).`);
      }

      const isStallOrOperator = user.role === 'stall' || user.role === 'operator';
      if (isStallOrOperator && user.stallId) {
        const belongsToStall = await this.ticketRepo.hasItemsFromStall(client, ticketId, user.stallId);
        if (!belongsToStall) {
          throw new ForbiddenError('Esse ticket não pertence à sua barraca.');
        }
      }

      const items = await this.ticketRepo.findItemsByTicketId(ticketId, client);
      for (const item of items) {
        await this.productRepo.incrementStock(item.product_id, item.quantity, client);
      }

      await this.ticketRepo.updateStatus(client, ticketId, 'reverted');

      await client.query('COMMIT');

      await this.auditLogger({
        userId: user.sub,
        action: 'TICKET_REVERTED',
        entityType: 'tickets',
        entityId: ticketId,
        before: { status: 'validated' },
        after: { status: 'reverted' }
      });

      if (user.stallId) {
        this.broadcastStall(user.stallId, 'INVENTORY_UPDATED', { ticketId });
      }
      await this.broadcast();
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Caso de uso: Validação direta na barraca (venda direta / emissão já validada)
   */
  async validateDirectSell(
    ticketId: string,
    stallId: string,
    operatorId: number,
    items: DirectValidationItem[]
  ): Promise<void> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('O carrinho está vazio.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let total = 0;
      for (const item of items) {
        const product = await this.productRepo.findByStallAndIdForUpdate(item.productId, stallId, client);
        if (!product) {
          throw new NotFoundError(`Produto ${item.productId} não encontrado na barraca ${stallId}.`);
        }

        const stock = Number(product.stock);
        if (stock < item.quantity) {
          throw new InsufficientStockError(product.name, stock, item.productId);
        }

        await this.productRepo.decrementStock(item.productId, item.quantity, client);
        total += item.quantity * item.unitPrice;
      }

      const code = `TKT-${ticketId.substring(0, 6).toUpperCase()}`;
      await this.ticketRepo.createWithItems(client, {
        ticketId,
        code,
        total,
        operatorId,
        stallId,
        items
      });

      await this.ticketRepo.updateStatus(client, ticketId, 'validated');

      await client.query('COMMIT');

      await this.auditLogger({
        userId: operatorId,
        action: 'TICKET_VALIDATED',
        entityType: 'tickets',
        entityId: ticketId
      });

      this.broadcastStall(stallId, 'INVENTORY_UPDATED', { ticketId });
      this.broadcastStall(stallId, 'TICKET_VALIDATED', { ticketId });
      await this.broadcast();
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
