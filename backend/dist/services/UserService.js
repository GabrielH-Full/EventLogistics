"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DomainErrors_1 = require("../errors/DomainErrors");
class UserService {
    constructor(pool, userRepo) {
        this.pool = pool;
        this.userRepo = userRepo;
    }
    toDTO(row) {
        const { password_hash, user_id, id, display_name, ...rest } = row;
        return {
            id: user_id || id,
            username: rest.username,
            role: rest.role,
            isActive: rest.is_active,
            stalls: rest.stalls,
            createdAt: rest.created_at,
            updatedAt: rest.updated_at
        };
    }
    async listUsers(filters = {}) {
        const { rows, total } = await this.userRepo.findAll(filters);
        const limit = filters.limit || 10;
        const page = filters.page || 1;
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            rows: rows.map(r => this.toDTO(r)),
            total,
            page,
            limit,
            totalPages
        };
    }
    async getUserById(id) {
        const user = await this.userRepo.findById(id);
        if (!user) {
            throw new DomainErrors_1.NotFoundError('Usuário não encontrado.');
        }
        const stalls = await this.userRepo.getStallsByUserId(id);
        return {
            ...this.toDTO(user),
            stalls
        };
    }
    async createUser(input) {
        if (!input.username || !input.password || !input.role) {
            throw new DomainErrors_1.ValidationError('Username, password e role são obrigatórios.');
        }
        const existing = await this.userRepo.findByUsername(input.username);
        if (existing) {
            throw new DomainErrors_1.ConflictError('Username já está em uso.');
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const newUser = await this.userRepo.create(client, {
                username: input.username,
                passwordHash,
                role: input.role,
                displayName: input.username,
                isActive: input.isActive ?? true
            });
            if (input.stallIds && input.stallIds.length > 0) {
                await this.userRepo.syncStalls(newUser.user_id, input.stallIds, client);
            }
            await client.query('COMMIT');
            return this.toDTO(newUser);
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    async updateUser(id, input) {
        if (!input.username || !input.role) {
            throw new DomainErrors_1.ValidationError('Username e role são obrigatórios.');
        }
        const existing = await this.userRepo.findByUsername(input.username);
        if (existing && existing.user_id !== id) {
            throw new DomainErrors_1.ConflictError('Username já está em uso.');
        }
        let passwordHash;
        if (input.password) {
            passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const updatedUser = await this.userRepo.update(client, id, {
                username: input.username,
                role: input.role,
                passwordHash,
                displayName: input.username,
                isActive: input.isActive
            });
            if (!updatedUser) {
                throw new DomainErrors_1.NotFoundError('Usuário não encontrado.');
            }
            if (input.stallIds !== undefined) {
                await this.userRepo.syncStalls(id, input.stallIds, client);
            }
            await client.query('COMMIT');
            return this.toDTO(updatedUser);
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    async toggleUserStatus(id) {
        const updated = await this.userRepo.toggleStatus(id);
        if (!updated) {
            throw new DomainErrors_1.NotFoundError('Usuário não encontrado.');
        }
        return this.toDTO(updated);
    }
    async deleteUser(id) {
        const deleted = await this.userRepo.delete(id);
        if (!deleted) {
            throw new DomainErrors_1.NotFoundError('Usuário não encontrado.');
        }
    }
}
exports.UserService = UserService;
