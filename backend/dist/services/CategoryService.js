"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const DomainErrors_1 = require("../errors/DomainErrors");
class CategoryService {
    constructor(categoryRepo, productRepo) {
        this.categoryRepo = categoryRepo;
        this.productRepo = productRepo;
    }
    async listCategories(parentType) {
        return this.categoryRepo.findAll(parentType);
    }
    async createCategory(name, parentType) {
        if (!name || (parentType !== 'food' && parentType !== 'drink')) {
            throw new DomainErrors_1.ValidationError('Campos name e parent_type (food|drink) são obrigatórios.');
        }
        try {
            return await this.categoryRepo.create({ name, parentType });
        }
        catch (err) {
            if (err.code === '23505') {
                throw new DomainErrors_1.ConflictError('Já existe uma categoria com este nome neste tipo.');
            }
            throw err;
        }
    }
    async deleteCategory(id) {
        const productsCount = await this.productRepo.countByCategoryId(id);
        if (productsCount > 0) {
            throw new DomainErrors_1.ConflictError('Não é possível excluir subcategoria contendo produtos vinculados.');
        }
        const deletedId = await this.categoryRepo.delete(id);
        if (!deletedId) {
            throw new DomainErrors_1.NotFoundError('Subcategoria não encontrada.');
        }
    }
}
exports.CategoryService = CategoryService;
