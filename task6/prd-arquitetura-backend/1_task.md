---
status: completed
parallelizable: false
blocked_by: []
---

<task_context>
<domain>engine/infra/foundation</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>typescript</dependencies>
<unblocks>["2.0", "3.0"]</unblocks>
</task_context>

# Tarefa 1.0: Configuração de Tipos Compartilhados e Erros de Domínio

## Visão Geral

Estabelecer a fundação tipada do projeto através da criação das definições de dados de banco (Row types), objetos de transferência de dados (DTOs) e a hierarquia de erros de domínio tipados (`DomainErrors`). Essa tarefa é o pré-requisito base para os repositórios, services e rotas.

## Requisitos

- Criar `src/types/db.ts` contendo as interfaces `TicketRow`, `ProductRow`, `TicketItemRow`, `UserRow`, `StallRow`, `TicketDTO`, `UserDTO`, `ProductDTO`, `SaleItem`, `AuthUser` e tipos auxiliares.
- Criar `src/errors/DomainErrors.ts` com classes customizadas herdando de `Error`: `InsufficientStockError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, `ValidationError`.
- Garantir exportação limpa e sem dependências circulares.

## Subtarefas

- [x] 1.1 Criar arquivo `src/types/db.ts` com todas as definições de Row e DTO conforme a Tech Spec.
- [x] 1.2 Criar arquivo `src/errors/DomainErrors.ts` com classes de erro especializadas e mensagens contextuais.
- [x] 1.3 Validar compilação TypeScript (`npm run build` ou `npx tsc --noEmit`).

## Sequenciamento

- Bloqueado por: Nenhum
- Desbloqueia: 2.0, 3.0
- Paralelizável: Não (fundação obrigatória)

## Detalhes de Implementação

```typescript
// src/errors/DomainErrors.ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InsufficientStockError extends DomainError {
  constructor(public productName: string, public available: number) {
    super(`Estoque insuficiente para "${productName}". Restam apenas ${available}.`);
  }
}

export class NotFoundError extends DomainError {}
export class ForbiddenError extends DomainError {}
export class ConflictError extends DomainError {}
export class ValidationError extends DomainError {}
```

## Critérios de Sucesso

- Tipos estruturais e classes de erro disponíveis e utilizáveis em todo o backend.
- Compilação do projeto executa sem erros de tipagem.\n