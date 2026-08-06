-- Seed Data for EventLogistics PostgreSQL

-- 1. Barracas
INSERT INTO stalls (stall_id, name, icon) VALUES
  ('pastel', 'Barraca do Pastel', 'bakery_dining'),
  ('churrasco', 'Barraca do Churrasco', 'outdoor_grill'),
  ('doces', 'Barraca de Doces', 'bakery_dining')
ON CONFLICT (stall_id) DO NOTHING;

-- 2. Usuários (Hashes bcrypt das senhas de demonstração: admin123, pastel123, churrasco123, doces123)
INSERT INTO users (username, password_hash, role, stall_id, display_name) VALUES
  ('admin', '$2a$10$HDfl5Hss11Iti0a.JsnRA.o86q8tJ61Gfp8mRFFdxobQ4bWcMBPHC', 'admin', NULL, 'Caixa Central'),
  ('pastel', '$2a$10$u/cRKPgBV0jq8MXmB.UFqeqF6ED/inllFi9/k6N3OfDNkaEL8DyXK', 'operator', 'pastel', 'Barraca do Pastel'),
  ('churrasco', '$2a$10$yth7MCZJQPgV.Zt7oFhERuyy27GoJQ.0YwSBReBB7IB5YMHPjV2zu', 'operator', 'churrasco', 'Barraca do Churrasco'),
  ('doces', '$2a$10$u3BKTvgt5eBt3lF5afBQz.2p2uhEyDj2RqF0EzWCd/4YRIUKlbWGu', 'operator', 'doces', 'Barraca de Doces')
ON CONFLICT (username) DO NOTHING;

-- 3. Produtos
INSERT INTO products (product_id, name, category, price, stock, max_stock, unit, stall_id, image) VALUES
  ('pastel_carne', 'Pastel de Carne', 'Salgados', 10.00, 45, 100, '100g', 'pastel', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400'),
  ('pastel_queijo', 'Pastel de Queijo', 'Salgados', 10.00, 12, 100, '100g', 'pastel', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400'),
  ('caldo_cana', 'Caldo de Cana', 'Bebidas', 8.00, 0, 50, '300ml', 'pastel', 'https://images.unsplash.com/photo-1622597489100-8d3a5a9d0b1c?auto=format&fit=crop&q=80&w=400'),
  ('espetinho_boi', 'Espetinho Boi', 'Salgados', 12.00, 80, 100, 'unid', 'churrasco', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400'),
  ('pao_alho', 'Pão de Alho', 'Salgados', 7.00, 15, 100, 'unid', 'churrasco', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=400'),
  ('cocada_cremosa', 'Cocada Cremosa', 'Doces', 6.00, 40, 100, 'unid', 'doces', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400'),
  ('brigadeiro_colher', 'Brigadeiro Gourmet', 'Doces', 5.00, 75, 100, 'unid', 'doces', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (product_id) DO NOTHING;

-- 4. Tickets e Itens
INSERT INTO tickets (ticket_id, code, total, status, created_at) VALUES
  ('t1', '#8492', 20.00, 'validated', now() - INTERVAL '1 minute'),
  ('t2', '#8491', 8.00, 'validated', now() - INTERVAL '3 minutes'),
  ('t3', '#8490', 30.00, 'validated', now() - INTERVAL '7 minutes'),
  ('t4', '#8489', 10.00, 'validated', now() - INTERVAL '12 minutes'),
  ('t5', '#8488', 16.00, 'pending', now() - INTERVAL '15 minutes')
ON CONFLICT (ticket_id) DO NOTHING;

INSERT INTO ticket_items (ticket_id, product_id, quantity, unit_price) VALUES
  ('t1', 'pastel_carne', 2, 10.00),
  ('t2', 'caldo_cana', 1, 8.00),
  ('t3', 'pastel_queijo', 3, 10.00),
  ('t4', 'pastel_carne', 1, 10.00),
  ('t5', 'caldo_cana', 2, 8.00);
