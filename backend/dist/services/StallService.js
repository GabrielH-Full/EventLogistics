"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StallService = void 0;
const crypto_1 = require("crypto");
const audit_1 = require("../audit");
const socket_1 = require("../socket");
const DomainErrors_1 = require("../errors/DomainErrors");
class StallService {
    constructor(pool, stallRepo, productRepo, auditLogger = audit_1.logAudit, broadcast = socket_1.broadcastState) {
        this.pool = pool;
        this.stallRepo = stallRepo;
        this.productRepo = productRepo;
        this.auditLogger = auditLogger;
        this.broadcast = broadcast;
    }
    async listStalls(filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const { rows, total } = await this.stallRepo.findAll(filters);
        return { data: rows, total, page, limit };
    }
    async getStallById(id) {
        const result = await this.stallRepo.findByIdWithUserIds(id);
        if (!result) {
            throw new DomainErrors_1.NotFoundError('Barraca não encontrada.');
        }
        return { ...result.stall, user_ids: result.userIds };
    }
    async createStall(input, user) {
        if (!input.name || !input.type) {
            throw new DomainErrors_1.ValidationError('Campos name e type são obrigatórios.');
        }
        const stallId = input.stallId || (0, crypto_1.randomUUID)();
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
                after: created
            });
            await this.broadcast();
            return created;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    async updateStall(id, input, user) {
        if (!input.name || !input.type) {
            throw new DomainErrors_1.ValidationError('Campos name e type são obrigatórios.');
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
                throw new DomainErrors_1.NotFoundError('Barraca não encontrada.');
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
                after: updated
            });
            await this.broadcast();
            return updated;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    async toggleStallStatus(id, user) {
        const stall = await this.stallRepo.findById(id);
        if (!stall) {
            throw new DomainErrors_1.NotFoundError('Barraca não encontrada.');
        }
        const updated = await this.stallRepo.toggleStatus(id);
        if (!updated) {
            throw new DomainErrors_1.NotFoundError('Barraca não encontrada.');
        }
        await this.auditLogger({
            userId: user.sub,
            action: 'STALL_UPDATED',
            entityType: 'stalls',
            entityId: id,
            before: { is_active: stall.is_active },
            after: updated
        });
        await this.broadcast();
        return updated;
    }
    async deleteStall(id, user) {
        const productsCount = await this.productRepo.countByStallId(id);
        if (productsCount > 0) {
            throw new DomainErrors_1.ConflictError('Não é possível excluir barraca com produtos cadastrados. Desative a barraca.');
        }
        const deleted = await this.stallRepo.delete(id);
        if (!deleted) {
            throw new DomainErrors_1.NotFoundError('Barraca não encontrada.');
        }
        await this.auditLogger({
            userId: user.sub,
            action: 'STALL_DELETED',
            entityType: 'stalls',
            entityId: id,
            before: deleted,
            after: null
        });
        await this.broadcast();
    }
}
exports.StallService = StallService;
