import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { StallRepository, ProductRepository } from '../repositories';
import { logAudit } from '../audit';
import { broadcastState } from '../socket';
import { 
  CreateStallInput, 
  UpdateStallInput, 
  StallFilters, 
  AuthUser 
} from '../types/db';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

export class StallService {
  constructor(
    private pool: Pool,
    private stallRepo: StallRepository,
    private productRepo: ProductRepository,
    private auditLogger: typeof logAudit = logAudit,
    private broadcast: typeof broadcastState = broadcastState
  ) {}

  async listStalls(filters: StallFilters = {}): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { rows, total } = await this.stallRepo.findAll(filters);
    return { data: rows, total, page, limit };
  }

  async getStallById(id: string): Promise<any> {
    const result = await this.stallRepo.findByIdWithUserIds(id);
    if (!result) {
      throw new NotFoundError('Barraca não encontrada.');
    }
    return { ...result.stall, user_ids: result.userIds };
  }

  async createStall(input: CreateStallInput & { type: string }, user: AuthUser): Promise<any> {
    if (!input.name || !input.type) {
      throw new ValidationError('Campos name e type são obrigatórios.');
    }

    const stallId = input.stallId || randomUUID();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const created = await this.stallRepo.create({
        stallId,
        name: input.name,
        type: input.type,
        icon: input.icon || 'Store',
        isActive: input.isActive ?? true
      }, client);

      if (input.userIds && input.userIds.length > 0) {
        await this.stallRepo.syncUsers(stallId, input.userIds, client);
      }

      await client.query('COMMIT');

      await this.auditLogger({
        userId: user.sub,
        action: 'STALL_CREATED',
        entityType: 'stalls',
        entityId: stallId,
        before: null,
        after: created as unknown as Record<string, unknown>
      });

      await this.broadcast();
      return created;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStall(id: string, input: UpdateStallInput & { type: string }, user: AuthUser): Promise<any> {
    if (!input.name || !input.type) {
      throw new ValidationError('Campos name e type são obrigatórios.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const updated = await this.stallRepo.update(id, {
        name: input.name,
        type: input.type,
        icon: input.icon || 'Store',
        isActive: input.isActive
      }, client);

      if (!updated) {
        throw new NotFoundError('Barraca não encontrada.');
      }

      if (input.userIds !== undefined) {
        await this.stallRepo.syncUsers(id, input.userIds, client);
      }

      await client.query('COMMIT');

      await this.auditLogger({
        userId: user.sub,
        action: 'STALL_UPDATED',
        entityType: 'stalls',
        entityId: id,
        before: null,
        after: updated as unknown as Record<string, unknown>
      });

      await this.broadcast();
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async toggleStallStatus(id: string, user: AuthUser): Promise<any> {
    const stall = await this.stallRepo.findById(id);
    if (!stall) {
      throw new NotFoundError('Barraca não encontrada.');
    }

    const updated = await this.stallRepo.toggleStatus(id);
    if (!updated) {
      throw new NotFoundError('Barraca não encontrada.');
    }

    await this.auditLogger({
      userId: user.sub,
      action: 'STALL_UPDATED',
      entityType: 'stalls',
      entityId: id,
      before: { is_active: stall.is_active },
      after: updated as unknown as Record<string, unknown>
    });

    await this.broadcast();
    return updated;
  }

  async deleteStall(id: string, user: AuthUser): Promise<void> {
    const productsCount = await this.productRepo.countByStallId(id);
    if (productsCount > 0) {
      throw new ConflictError('Não é possível excluir barraca com produtos cadastrados. Desative a barraca.');
    }

    const deleted = await this.stallRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Barraca não encontrada.');
    }

    await this.auditLogger({
      userId: user.sub,
      action: 'STALL_DELETED',
      entityType: 'stalls',
      entityId: id,
      before: deleted as unknown as Record<string, unknown>,
      after: null
    });

    await this.broadcast();
  }
}
