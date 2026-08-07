import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgres://eventlogistics:eventlogistics_secret@localhost:5433/eventlogistics_db'
});

export interface PublicState {
  products: Record<string, unknown>[];
  stalls:   Record<string, unknown>[];
  tickets:  Record<string, unknown>[];
}

export async function fetchPublicState(): Promise<PublicState> {
  const [products, stalls, tickets] = await Promise.all([
    db.query(`
      SELECT 
        product_id as id, name, category, price, stock, max_stock as "maxStock", unit, image, stall_id as "stallId"
      FROM products 
      WHERE is_active = true 
      ORDER BY name
    `),
    db.query(`
      SELECT stall_id as id, name, icon 
      FROM stalls 
      WHERE is_active = true 
      ORDER BY name
    `),
    db.query(`
      SELECT t.ticket_id as id, t.code, t.total, t.status, t.created_at as timestamp,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'productId', ti.product_id,
              'name', p.name,
              'category', p.category,
              'quantity', ti.quantity,
              'price', ti.unit_price
            )
          ) FILTER (WHERE ti.product_id IS NOT NULL),
          '[]'::jsonb
        ) as items
      FROM tickets t
      LEFT JOIN ticket_items ti ON t.ticket_id = ti.ticket_id
      LEFT JOIN products p ON ti.product_id = p.product_id
      GROUP BY t.ticket_id
      ORDER BY t.created_at DESC 
      LIMIT 100
    `),
  ]);
  
  // Transform price to Number as PostgreSQL numeric comes as string, 
  // also add 'time' field to tickets which frontend expects
  return {
    products: products.rows.map(p => ({ ...p, price: Number(p.price) })),
    stalls:   stalls.rows,
    tickets:  tickets.rows.map(t => ({ ...t, total: Number(t.total), time: 'Agora' })),
  };
}
