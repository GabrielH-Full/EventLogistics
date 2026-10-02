"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const crypto_1 = require("crypto");
const audit_1 = require("../audit");
const socket_1 = require("../socket");
const DomainErrors_1 = require("../errors/DomainErrors");
class ProductService {
    constructor(productRepo, auditLogger = audit_1.logAudit, broadcast = socket_1.broadcastState) {
        this.productRepo = productRepo;
        this.auditLogger = auditLogger;
        this.broadcast = broadcast;
    }
    async listProducts(filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const { rows, total } = await this.productRepo.findAll(filters);
        return { data: rows, total, page, limit };
    }
    async getProductById(id) {
        const product = await this.productRepo.findByIdWithDetails(id);
        if (!product) {
            throw new DomainErrors_1.NotFoundError('Produto não encontrado.');
        }
        return product;
    }
    async createProduct(input, user) {
        if (!input.name || !input.stallId || !input.categoryId || input.price === undefined) {
            throw new DomainErrors_1.ValidationError('Campos name, stall_id, category_id, price são obrigatórios.');
        }
        if (typeof input.price !== 'number' || input.price <= 0 || isNaN(input.price)) {
            throw new DomainErrors_1.ValidationError('Preço inválido — deve ser um número positivo.');
        }
        const productId = input.productId || (0, crypto_1.randomUUID)();
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
            after: created
        });
        await this.broadcast();
        return created;
    }
    async updateProduct(id, input, user) {
        if (!input.name || !input.stallId || !input.categoryId || input.price === undefined) {
            throw new DomainErrors_1.ValidationError('Campos name, stall_id, category_id, price são obrigatórios.');
        }
        if (typeof input.price !== 'number' || input.price <= 0 || isNaN(input.price)) {
            throw new DomainErrors_1.ValidationError('Preço inválido — deve ser um número positivo.');
        }
        const updated = await this.productRepo.update(id, {
            name: input.name,
            stallId: input.stallId,
            categoryId: input.categoryId,
            price: input.price,
            isActive: input.isActive ?? true
        });
        if (!updated) {
            throw new DomainErrors_1.NotFoundError('Produto não encontrado.');
        }
        await this.auditLogger({
            userId: user.sub,
            action: 'PRODUCT_UPDATED',
            entityType: 'products',
            entityId: id,
            before: null,
            after: updated
        });
        await this.broadcast();
        return updated;
    }
    async toggleProductStatus(id, user) {
        const product = await this.productRepo.findById(id);
        if (!product) {
            throw new DomainErrors_1.NotFoundError('Produto não encontrado.');
        }
        const updated = await this.productRepo.toggleStatus(id);
        if (!updated) {
            throw new DomainErrors_1.NotFoundError('Produto não encontrado.');
        }
        await this.auditLogger({
            userId: user.sub,
            action: 'PRODUCT_UPDATED',
            entityType: 'products',
            entityId: id,
            before: { is_active: product.is_active },
            after: updated
        });
        await this.broadcast();
        return updated;
    }
    async deleteProduct(id, user) {
        const hasHistory = await this.productRepo.hasTicketHistory(id);
        if (hasHistory) {
            throw new DomainErrors_1.ConflictError('Não é possível excluir produto com histórico de vendas (tickets). Desative o produto.');
        }
        const deleted = await this.productRepo.delete(id);
        if (!deleted) {
            throw new DomainErrors_1.NotFoundError('Produto não encontrado.');
        }
        await this.auditLogger({
            userId: user.sub,
            action: 'PRODUCT_DELETED',
            entityType: 'products',
            entityId: id,
            before: deleted,
            after: null
        });
        await this.broadcast();
    }
}
exports.ProductService = ProductService;
