"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.ValidationError = exports.ConflictError = exports.ForbiddenError = exports.NotFoundError = exports.InsufficientStockError = exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.DomainError = DomainError;
class InsufficientStockError extends DomainError {
    constructor(productName, available, productId) {
        super(`Estoque insuficiente para "${productName}". Restam apenas ${available}.`);
        this.productName = productName;
        this.available = available;
        this.productId = productId;
    }
}
exports.InsufficientStockError = InsufficientStockError;
class NotFoundError extends DomainError {
    constructor(message = 'Recurso não encontrado.') {
        super(message);
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenError extends DomainError {
    constructor(message = 'Acesso não autorizado para este recurso.') {
        super(message);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends DomainError {
    constructor(message = 'Conflito com o estado atual do recurso.') {
        super(message);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends DomainError {
    constructor(message = 'Dados fornecidos inválidos.') {
        super(message);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends DomainError {
    constructor(message = 'Autenticação necessária.') {
        super(message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
