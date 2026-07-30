-- Migration: 001_init_schema.sql
-- Description: Schema inicial do EventLogistics no PostgreSQL conforme postgres-template.md

-- 1. Usuários
CREATE TABLE IF NOT EXISTS users (
    user_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'stall')),
    stall_id      TEXT NULL,
    display_name  TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Barracas
CREATE TABLE IF NOT EXISTS stalls (
    stall_id TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    icon     TEXT NOT NULL
);

-- 3. Produtos
CREATE TABLE IF NOT EXISTS products (
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

-- Índice em Foreign Key (Recomendado pelo PostgreSQL Template)
CREATE INDEX IF NOT EXISTS idx_products_stall_id ON products(stall_id);

-- 4. Tickets (Vendas)
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id  TEXT PRIMARY KEY,
    code       TEXT NOT NULL,
    total      NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- 5. Itens do Ticket (N:M Normalizado)
CREATE TABLE IF NOT EXISTS ticket_items (
    ticket_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id      TEXT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    product_id     TEXT NOT NULL REFERENCES products(product_id),
    quantity       INTEGER NOT NULL CHECK (quantity > 0),
    unit_price     NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- Índices em Foreign Keys
CREATE INDEX IF NOT EXISTS idx_ticket_items_ticket_id ON ticket_items(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_items_product_id ON ticket_items(product_id);
