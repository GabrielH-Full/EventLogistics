# Especificação Técnica — Refatoração para Arquitetura em 3 Camadas
**EventLogistics · Backend Node.js / TypeScript**  
**Versão:** 1.0 · **Data:** 2026-08-16 · **Status:** Aprovado  
**PRD de Referência:** `prd.md`

---

## Resumo Executivo

Esta Especificação Técnica estabelece a arquitetura e o plano de engenharia para a transição do backend monolítico do EventLogistics para uma arquitetura em 3 camadas desacopladas: **Routes (HTTP) → Services (Domínio/Regras de Negócio) → Repositories (Persistência SQL)**.

A estratégia preserva estritamente os contratos externos existentes (rotas HTTP REST, formato JSON de requisição/resposta, eventos WebSocket e schema relacional PostgreSQL). A orquestração transacional adota o padrão **Unit of Work** repassando o `PoolClient` do `pg` dos Services para os Repositories, garantindo atomicidade e permitindo testes unitários com mocks puros sem acoplamento a banco de dados real.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 1 — Routes (src/routes/*.ts)                            │
│  • Validação sintática de payload (schema/formato)              │
│  • Mapeamento de erros de domínio para códigos de status HTTP   │
│  • Delegação integral da lógica de aplicação aos Services       │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 2 — Services (src/services/*.ts)           [NOVOS]      │
│  • Orquestração de casos de uso e regras de negócio             │
│  • Gerenciamento de ciclo de vida de transações (Unit of Work)  │
│  • Disparo de efeitos colaterais (logAudit e broadcastState)    │
│  • Isolamento total de infraestrutura HTTP (sem Express)        │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 3 — Repositories (src/repositories/*.ts)  [NOVOS]      │
│  • Encapsulamento de queries SQL (pg Pool / PoolClient)         │
│  • Execução de consultas atômicas com locks (FOR UPDATE)        │
│  • Sem regras de negócio e sem dependências de WebSocket/Audit  │
└─────────────────────────────────────────────────────────────────┘

Módulos Compartilhados / Infraestrutura:
  • src/db.ts: Instância singleton do Pool e fetchPublicState()
  • src/socket.ts: broadcastState() e broadcastToStall()
  • src/audit.ts: logAudit()
  • src/errors/DomainErrors.ts: Hierarquia de erros tipados
  • src/types/db.ts: Definições de entidades Row e DTOs
```

---

## Design de Implementação

### Interfaces Principais

#### Repositories (`src/repositories/`)

```typescript
// src/repositories/TicketRepository.ts
export class TicketRepository {
  constructor(private pool: Pool) {}

  async findByIdForUpdate(client: PoolClient, ticketId: string): Promise<TicketRow | null>;
  async createWithItems(client: PoolClient, input: CreateTicketInput): Promise<void>;
  async updateStatus(client: PoolClient, ticketId: string, status: TicketStatus): Promise<TicketRow>;
  async findItemsByTicketId(ticketId: string): Promise<TicketItemRow[]>;
  async hasItemsFromStall(client: PoolClient, ticketId: string, stallId: string): Promise<boolean>;
}

// src/repositories/ProductRepository.ts
export class ProductRepository {
  constructor(private pool: Pool) {}

  async findById(id: string, client?: PoolClient): Promise<ProductRow | null>;
  async findByIdForUpdate(client: PoolClient, id: string): Promise<ProductRow | null>;
  async decrementStock(client: PoolClient, productId: string, quantity: number): Promise<void>;
  async incrementStock(productId: string, amount: number): Promise<ProductRow>;
  async resetStockByStall(stallId: string): Promise<ProductRow[]>;
  async findAll(filters: ProductFilters): Promise<{ rows: ProductRow[]; total: number }>;
  async create(input: CreateProductInput): Promise<ProductRow>;
  async update(id: string, input: UpdateProductInput): Promise<ProductRow | null>;
  async toggleStatus(id: string): Promise<ProductRow | null>;
  async delete(id: string): Promise<ProductRow | null>;
  async hasTicketHistory(id: string): Promise<boolean>;
}

// src/repositories/StallRepository.ts
export class StallRepository {
  constructor(private pool: Pool) {}

  async findAll(filters?: StallFilters): Promise<{ rows: StallRow[]; total: number }>;
  async findById(id: string): Promise<StallRow | null>;
  async create(input: CreateStallInput): Promise<StallRow>;
  async update(id: string, input: UpdateStallInput): Promise<StallRow | null>;
  async toggleStatus(id: string): Promise<StallRow | null>;
  async delete(id: string): Promise<StallRow | null>;
  async syncUsers(stallId: string, userIds: number[]): Promise<void>;
}

// src/repositories/UserRepository.ts
export class UserRepository {
  constructor(private pool: Pool) {}

  async findAll(filters?: UserFilters): Promise<{ rows: UserRow[]; total: number }>;
  async findById(id: number): Promise<UserRow | null>;
  async findByUsername(username: string): Promise<UserRow | null>;
  async create(client: PoolClient, input: CreateUserDbInput): Promise<UserRow>;
  async update(client: PoolClient, id: number, input: UpdateUserDbInput): Promise<UserRow | null>;
  async toggleStatus(id: number): Promise<UserRow | null>;
  async delete(id: number): Promise<UserRow | null>;
  async syncStalls(client: PoolClient, userId: number, stallIds: string[]): Promise<void>;
  async getStallsByUserId(userId: number): Promise<string[]>;
}
```

#### Services (`src/services/`)

```typescript
// src/services/TicketService.ts
export class TicketService {
  constructor(
    private pool: Pool,
    private ticketRepo: TicketRepository,
    private productRepo: ProductRepository,
    private auditLogger: typeof logAudit,
    private broadcast: typeof broadcastState
  ) {}

  async createTicket(items: SaleItem[], operatorId: string): Promise<TicketDTO>;
  async validateTicket(ticketId: string, user: AuthUser): Promise<TicketDTO>;
  async revertTicket(ticketId: string, user: AuthUser): Promise<void>;
}

// src/services/InventoryService.ts
export class InventoryService {
  constructor(
    private productRepo: ProductRepository,
    private auditLogger: typeof logAudit,
    private broadcast: typeof broadcastState
  ) {}

  async addProduction(productId: string, amount: number, user: AuthUser): Promise<ProductDTO>;
  async resetStallStock(stallId: string, user: AuthUser): Promise<ProductDTO[]>;
}

// src/services/UserService.ts
export class UserService {
  constructor(
    private pool: Pool,
    private userRepo: UserRepository
  ) {}

  async createUser(input: CreateUserInput): Promise<UserDTO>;
  async listUsers(filters?: UserFilters): Promise<PaginatedResult<UserDTO>>;
  async getUserById(id: number): Promise<UserDTO>;
  async updateUser(id: number, input: UpdateUserInput): Promise<UserDTO>;
  async toggleUserStatus(id: number): Promise<UserDTO>;
  async deleteUser(id: number): Promise<void>;
}
```

---

### Modelos de Dados

```typescript
// src/types/db.ts
export type TicketStatus = 'pending' | 'validated' | 'reverted';
export type UserRole = 'admin' | 'stall' | 'operator';

export interface TicketRow {
  id: string;
  code: string;
  total: number;
  status: TicketStatus;
  operator_id: string;
  created_at: Date;
}

export interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  max_stock: number;
  stall_id: string;
  category_id: string;
  is_active: boolean;
}

export interface TicketItemRow {
  id: string;
  ticket_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
  category_id?: string;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}

export interface StallRow {
  id: string;
  name: string;
  is_active: boolean;
}

// DTOs & Entidades de Domínio
export interface TicketDTO extends TicketRow {
  items?: TicketItemRow[];
}

export interface UserDTO extends Omit<UserRow, 'password_hash'> {
  stalls?: string[];
}

export interface ProductDTO extends ProductRow {}

export interface SaleItem {
  productId: string;
  quantity: number;
}

export interface AuthUser {
  sub: string;
  role: UserRole;
  stallId?: string;
}
```

---

### Endpoints de API

| Método | Endpoint | Service Responsável | Sucesso | Mapeamento de Erros |
|---|---|---|---|---|
| POST | `/api/tickets` | `TicketService.createTicket` | 201 Created | 400 (Bad Request), 409 (InsufficientStockError), 404 (NotFoundError) |
| POST | `/api/tickets/:id/validate` | `TicketService.validateTicket` | 200 OK | 403 (ForbiddenError), 404 (NotFoundError), 409 (ConflictError) |
| POST | `/api/tickets/:id/revert` | `TicketService.revertTicket` | 200 OK | 403 (ForbiddenError), 404 (NotFoundError), 409 (ConflictError) |
| POST | `/api/products/:id/production` | `InventoryService.addProduction` | 200 OK | 403 (ForbiddenError), 404 (NotFoundError) |
| POST | `/api/stalls/:stallId/reset` | `InventoryService.resetStallStock` | 200 OK | 403 (ForbiddenError), 404 (NotFoundError) |
| GET | `/api/admin/products` | `ProductService.listProducts` | 200 OK | 500 (Internal Server Error) |
| POST | `/api/admin/products` | `ProductService.createProduct` | 201 Created | 400 (Bad Request) |
| PUT | `/api/admin/products/:id` | `ProductService.updateProduct` | 200 OK | 404 (NotFoundError) |
| DELETE | `/api/admin/products/:id` | `ProductService.deleteProduct` | 200 OK | 400/409 (ConflictError - histórico existente) |
| GET | `/api/admin/users` | `UserService.listUsers` | 200 OK | 500 |
| POST | `/api/admin/users` | `UserService.createUser` | 201 Created | 409 (ConflictError - username duplicado) |
| PUT | `/api/admin/users/:id` | `UserService.updateUser` | 200 OK | 404, 409 |
| DELETE | `/api/admin/users/:id` | `UserService.deleteUser` | 200 OK | 404 |
| GET | `/api/admin/stalls` | `StallService.listStalls` | 200 OK | 500 |
| POST | `/api/admin/stalls` | `StallService.createStall` | 201 Created | 400 |
| PUT | `/api/admin/stalls/:id` | `StallService.updateStall` | 200 OK | 404 |
| DELETE | `/api/admin/stalls/:id` | `StallService.deleteStall` | 200 OK | 404 |

---

## Pontos de Integração

- **PostgreSQL Pool (`pg`):** Mantido em `src/db.ts`. O pool é compartilhado e injetado nos Repositories e Services que controlam transações.
- **WebSocket Broadcast (`src/socket.ts`):** `broadcastState()` e `broadcastToStall()` são disparados exclusivamente dentro da camada de Service após a conclusão bem-sucedida de mutações.
- **Audit Logger (`src/audit.ts`):** `logAudit()` é invocado pelos Services registrando autor, ação, entidade e timestamps.

---

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Nível de Risco | Ação Requerida |
|---|---|---|---|
| `src/db.ts` | Remoção de métodos | Funções `validateTicket` e `revertTicket` migradas para Repositories/Services. Baixo risco. | Limpar exportações e validar que nenhum arquivo externo as consome. |
| `src/routes/*.ts` | Refatoração de handlers | Extração de SQL e regras para Services. Médio risco. | Substituição handler a handler mantendo assinatura de resposta idêntica. |
| `src/services/*.ts` | Novos módulos | Centralização da lógica de negócio. Baixo risco (código novo). | Injeção explícita de dependências e cobertura de testes. |
| `src/repositories/*.ts` | Novos módulos | Centralização de queries SQL. Baixo risco. | Mapeamento exato dos SQLs existentes com parametrização `$1, $2`. |
| API Externa & Frontend | Zero impacto | Nenhuma rota, payload ou código de status é alterado. Risco nulo. | Verificação de regressão via chamadas HTTP. |

---

## Abordagem de Testes

### Testes Unitários
- **Framework:** `vitest` ou `jest`
- **Foco:** `TicketService`, `InventoryService`, `UserService`, `ProductService`
- **Isolamento:** Repositórios, logger e WebSocket mockados via stubs em memória.
- **Cenários Críticos:**
  - Venda com estoque suficiente vs insuficiente (`InsufficientStockError`).
  - Validação de ticket por barraca autorizada vs não autorizada (`ForbiddenError`).
  - Reversão de ticket com status inconsistente.
  - Sincronização de barracas de usuário com rollback transacional em caso de falha.

### Testes de Integração
- Testes ponta a ponta nas rotas principais com banco de testes local.
- Validação de transação real: atomicidade em concorrência de estoque (`SELECT FOR UPDATE`).

---

## Sequenciamento de Desenvolvimento

1. **Fase 1: Fundação de Tipos e Erros de Domínio**
   - Criar `src/errors/DomainErrors.ts`
   - Criar `src/types/db.ts`
2. **Fase 2: Camada de Repositórios**
   - Criar `TicketRepository`, `ProductRepository`, `StallRepository`, `UserRepository`
   - Limpar `src/db.ts`
3. **Fase 3: Camada de Services**
   - Implementar `TicketService`, `InventoryService`, `UserService`, `ProductService`, `StallService`, `CategoryService`
4. **Fase 4: Refatoração das Rotas**
   - Migrar handlers de `ticketRoutes.ts`, `productRoutes.ts`, `adminProductRoutes.ts`, `userRoutes.ts`, `adminStallRoutes.ts`
5. **Fase 5: Testes Unitários e Validação**
   - Testes unitários com mocks dos Services e verificação de regressão.

---

## Monitoramento e Observabilidade

- **Logs Estruturados:** Erros capturados nas rotas logam a causa original (`err.stack`) no console do servidor preservando detalhes para diagnóstico.
- **Trilha de Auditoria:** Chamadas explícitas a `logAudit` registradas no banco via tabela `audit_logs`.
- **Telemetria de WebSocket:** Monitoramento da taxa de emissão de eventos `state:update`.

---

## Considerações Técnicas

### Decisões Principais (ADRs)
- **ADR-001:** Adoção da Arquitetura em 3 Camadas para separação de responsabilidades e testabilidade.
- **ADR-002:** Padrão Unit of Work repassando `PoolClient` para transações atômicas seguras.
- **ADR-003:** Erros de Domínio Tipados para desacoplamento de status HTTP e lógica de negócio.

---

## Conformidade com Padrões
- Nenhuma dependência circular permitida.
- Express não deve ser importado em Services ou Repositories.
- Todo acesso SQL deve utilizar consultas preparadas/parametrizadas para prevenção de SQL Injection.\n