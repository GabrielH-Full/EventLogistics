import { CategoryRepository, ProductRepository } from '../repositories';
import { NotFoundError, ConflictError, ValidationError } from '../errors/DomainErrors';

export class CategoryService {
  constructor(
    private categoryRepo: CategoryRepository,
    private productRepo: ProductRepository
  ) {}

  async listCategories(parentType?: string): Promise<any[]> {
    return this.categoryRepo.findAll(parentType);
  }

  async createCategory(name: string, parentType: string): Promise<any> {
    if (!name || (parentType !== 'food' && parentType !== 'drink')) {
      throw new ValidationError('Campos name e parent_type (food|drink) são obrigatórios.');
    }

    try {
      return await this.categoryRepo.create({ name, parentType });
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictError('Já existe uma categoria com este nome neste tipo.');
      }
      throw err;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const productsCount = await this.productRepo.countByCategoryId(id);
    if (productsCount > 0) {
      throw new ConflictError('Não é possível excluir subcategoria contendo produtos vinculados.');
    }

    const deletedId = await this.categoryRepo.delete(id);
    if (!deletedId) {
      throw new NotFoundError('Subcategoria não encontrada.');
    }
  }
}
