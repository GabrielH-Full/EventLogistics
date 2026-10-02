import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories';
import { 
  UserDTO, 
  CreateUserInput, 
  UpdateUserInput, 
  UserFilters, 
  PaginatedResult,
  UserRow 
} from '../types/db';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../errors/DomainErrors';

export class UserService {
  constructor(
    private pool: Pool,
    private userRepo: UserRepository
  ) {}

  private toDTO(row: any): UserDTO {
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

  async listUsers(filters: UserFilters = {}): Promise<PaginatedResult<UserDTO>> {
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

  async getUserById(id: number): Promise<UserDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    const stalls = await this.userRepo.getStallsByUserId(id);
    return {
      ...this.toDTO(user),
      stalls
    };
  }

  async createUser(input: CreateUserInput): Promise<UserDTO> {
    if (!input.username || !input.password || !input.role) {
      throw new ValidationError('Username, password e role são obrigatórios.');
    }

    const existing = await this.userRepo.findByUsername(input.username);
    if (existing) {
      throw new ConflictError('Username já está em uso.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
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
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<UserDTO> {
    if (!input.username || !input.role) {
      throw new ValidationError('Username e role são obrigatórios.');
    }

    const existing = await this.userRepo.findByUsername(input.username);
    if (existing && existing.user_id !== id) {
      throw new ConflictError('Username já está em uso.');
    }

    let passwordHash: string | undefined;
    if (input.password) {
      passwordHash = await bcrypt.hash(input.password, 12);
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
        throw new NotFoundError('Usuário não encontrado.');
      }

      if (input.stallIds !== undefined) {
        await this.userRepo.syncStalls(id, input.stallIds, client);
      }

      await client.query('COMMIT');
      return this.toDTO(updatedUser);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async toggleUserStatus(id: number): Promise<UserDTO> {
    const updated = await this.userRepo.toggleStatus(id);
    if (!updated) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    return this.toDTO(updated);
  }

  async deleteUser(id: number): Promise<void> {
    const deleted = await this.userRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Usuário não encontrado.');
    }
  }
}
