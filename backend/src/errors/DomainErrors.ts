export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    public readonly productName: string,
    public readonly available: number,
    public readonly productId?: string
  ) {
    super(`Estoque insuficiente para "${productName}". Restam apenas ${available}.`);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Recurso não encontrado.') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Acesso não autorizado para este recurso.') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string = 'Conflito com o estado atual do recurso.') {
    super(message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string = 'Dados fornecidos inválidos.') {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Autenticação necessária.') {
    super(message);
  }
}
