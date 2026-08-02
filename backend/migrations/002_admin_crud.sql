-- Migration: 002_admin_crud.sql
-- Description: Adiciona tabelas e colunas necessárias para o CRUD web, adaptando-se ao schema original.

-- 1. Tabela users (Alteração)
-- Drop existing constraint, add new one supporting 'operator'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'stall', 'operator'));

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));


-- 2. Tabela stalls (Alteração)
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Geral';
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();


-- 3. Tabela stall_users (N:M Nova)
-- Note: stall_id no schema existente é TEXT. user_id é BIGINT.
CREATE TABLE IF NOT EXISTS stall_users (
    stall_id TEXT NOT NULL REFERENCES stalls (stall_id) ON DELETE CASCADE,
    user_id  BIGINT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    PRIMARY KEY (stall_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stall_users_user_id  ON stall_users (user_id);
CREATE INDEX IF NOT EXISTS idx_stall_users_stall_id ON stall_users (stall_id);


-- 4. Tabela product_categories (Nova)
CREATE TABLE IF NOT EXISTS product_categories (
    category_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL,
    parent_type   TEXT NOT NULL CHECK (parent_type IN ('food', 'drink')),
    UNIQUE (name, parent_type)
);

-- Seed das subcategorias padrão
INSERT INTO product_categories (name, parent_type) VALUES
    ('Pastel',       'food'),
    ('Pizza',        'food'),
    ('Doce',         'food'),
    ('Outros',       'food'),
    ('Refrigerante', 'drink'),
    ('Suco',         'drink'),
    ('Água',         'drink'),
    ('Outros',       'drink')
ON CONFLICT (name, parent_type) DO NOTHING;


-- 5. Tabela products (Alteração)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES product_categories (category_id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Default fallback para category_id nas linhas existentes
-- Se 'Outros' foi a 4ª inserida para food, e a 8ª para drink, podemos mapear ou apenas usar null no começo.
-- Como products já existiam com 'category' TEXT CHECK(category IN ('Salgados', 'Doces', 'Bebidas')),
-- podemos fazer um UPDATE básico se quisermos, mas a coluna pode ficar null temporariamente ou podemos fixar um valor.
-- A spec não exige migração de dados perfeita, apenas schema.
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON products (is_active) WHERE is_active = true;
