---
status: completed
parallelizable: false
blocked_by: []
---

<task_context>
<domain>backend/database/postgres</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database|docker|http_server</dependencies>
<unblocks>"2.0"</unblocks>
</task_context>

# Tarefa 1.0: Configuração Docker & Esquema PostgreSQL do EventLogistics

## Visao Geral

Esta tarefa cobre a infraestrutura containerizada e a criação completa do esquema relacional de banco de dados PostgreSQL em **Docker** para o ecossistema EventLogistics, substituindo a camada legada de armazenamento simples em arquivo JSON (`data.json`).

O ambiente deve ser orquestrado via **Docker Compose**, garantindo facilidade de inicialização local e consistência em produção. A modelagem segue rigorosamente as boas práticas do `postgres-template.md`, incluindo normalização (3NF), tipos de dados nativos adequados (`TIMESTAMPTZ`, `NUMERIC(10,2)`, `BIGINT GENERATED ALWAYS AS IDENTITY`), restrições de integridade (`CHECK constraints`), chaves estrangeiras (`FOREIGN KEY`) e a criação manual de índices em colunas FK para otimização de JOINs.

## Requisitos

- Configurar o banco de dados PostgreSQL containerizado via `docker-compose.yml` (imagem `postgres:16-alpine`, porta `5432`, volume para persistência e `healthcheck`).
- Implementar tabelas para as entidades do domínio EventLogistics: `users`, `stalls`, `products`, `tickets` e `ticket_items`.
- Utilizar `NUMERIC(10,2)` para todos os campos monetários (`products.price`, `tickets.total`, `ticket_items.unit_price`) evitando problemas de arredondamento de float.
- Utilizar `TIMESTAMPTZ` para carimbos de data/hora (`created_at`).
- Definir restrições `CHECK` para validação de integridade (ex: `stock >= 0`, `quantity > 0`, `total >= 0`).
- Criar índices explícitos B-Tree em todas as Foreign Keys (`products.stall_id`, `ticket_items.ticket_id`, `ticket_items.product_id`).
- Gerar script SQL de migração executável e idempotente (`backend/migrations/001_init_schema.sql`).

## Subtarefas

- [ ] 1.1 Criar o arquivo `docker-compose.yml` na raiz do projeto com o serviço `postgres`, volume persistente `postgres_data`, variáveis de ambiente e verificação de saúde (`healthcheck`).
- [ ] 1.2 Criar a tabela `users` com restrição de chave primária identity, unicidade em `username` e validação de papéis (`admin`, `stall`).
- [ ] 1.3 Criar a tabela `stalls` com chave primária e metadados da barraca.
- [ ] 1.4 Criar a tabela `products` associada à `stalls` via FK com `CHECK` de estoque (`stock >= 0` e `max_stock >= stock`) e preço (`price >= 0`).
- [ ] 1.5 Criar o índice manual de FK `idx_products_stall_id` na tabela `products`.
- [ ] 1.6 Criar a tabela `tickets` com status (`pending`, `validated`), total monetário e data de criação em `TIMESTAMPTZ`.
- [ ] 1.7 Criar a tabela normalizada `ticket_items` (relacionamento N:M entre `tickets` e `products`) com FKs, `ON DELETE CASCADE` e os índices manuais de FK (`idx_ticket_items_ticket_id` e `idx_ticket_items_product_id`).
- [ ] 1.8 Escrever script SQL de seed/carga inicial para os dados de homologação (`seed.sql`).
- [ ] 1.9 Iniciar o contêiner via `docker-compose up -d` e testar a execução do DDL e carga de seed no contêiner rodando.

## Sequenciamento

- Bloqueado por: Nenhum
- Desbloqueia: 2.0 (Integração do driver PostgreSQL no `backend/src/db.ts`)
- Paralelizavel: Nao (é a tarefa de base para a persistência)

## Detalhes de Implementacao

### 1. Orquestração Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: eventlogistics_db
    restart: always
    environment:
      POSTGRES_USER: eventlogistics
      POSTGRES_PASSWORD: eventlogistics_secret
      POSTGRES_DB: eventlogistics_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eventlogistics -d eventlogistics_db"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 2. DDL de Referência baseado em `postgres-template.md`

```sql
CREATE TABLE users (
    user_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'stall')),
    stall_id      TEXT NULL,
    display_name  TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stalls (
    stall_id TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    icon     TEXT NOT NULL
);

CREATE TABLE products (
    product_id TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT NOT NULL CHECK (category IN ('Salgados', 'Doces', 'Bebidas')),
    price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock      INTEGER NOT NULL CHECK (stock >= 0),
    max_stock  INTEGER NOT NULL CHECK (max_stock >= stock),
    unit       TEXT NOT NULL,
    stall_id   TEXT NOT NULL REFERENCES stalls(stall_id),
    image      TEXT NOT NULL
);

CREATE INDEX idx_products_stall_id ON products(stall_id);

CREATE TABLE tickets (
    ticket_id  TEXT PRIMARY KEY,
    code       TEXT NOT NULL,
    total      NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_status ON tickets(status);

CREATE TABLE ticket_items (
    ticket_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id      TEXT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    product_id     TEXT NOT NULL REFERENCES products(product_id),
    quantity       INTEGER NOT NULL CHECK (quantity > 0),
    unit_price     NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX idx_ticket_items_ticket_id ON ticket_items(ticket_id);
CREATE INDEX idx_ticket_items_product_id ON ticket_items(product_id);
```

## Criterios de Sucesso

- O container do PostgreSQL é inicializado com sucesso via `docker-compose up -d` e atinge estado saudável (*healthy*).
- O volume `postgres_data` garante a persistência dos dados entre reinicializações do container.
- O script DDL executa no container sem erros.
- Todas as constraints (`CHECK`, `NOT NULL`, `FOREIGN KEY`) estão ativas e impedem dados inválidos.
- Todos os JOINs de Foreign Keys possuem índices correspondentes (`idx_products_stall_id`, `idx_ticket_items_ticket_id`, `idx_ticket_items_product_id`).
