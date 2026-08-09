import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}


export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 10 atendentes + 5 operadores + 5 monitores
  connectionTimeoutMillis: 5_000, // 5 segundos para conectar
  idleTimeoutMillis: 30_000, // 30 segundos sem usar a conexão
});
db.on('connect', client => client.query('SET statement_timeout = 10000')); // 10 segundos para executar uma query

export interface PublicState {
  products: Record<string, unknown>[];
  stalls: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
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
    stalls: stalls.rows,
    tickets: tickets.rows.map(t => ({ ...t, total: Number(t.total), time: 'Agora' })),
  };
}

export interface TicketItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export async function validateTicket(
  ticketId: string,
  stallId: string,
  operatorId: number,
  items: TicketItemInput[]
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let total = 0;

    for (const item of items) {
      // Lock da linha do produto (evita leitura fantasma de estoque concorrente)
      const productRes = await client.query(
        'SELECT stock FROM products WHERE product_id = $1 AND stall_id = $2 FOR UPDATE',
        [item.productId, stallId]
      );

      if (productRes.rowCount === 0) {
        throw new Error(`Product ${item.productId} not found in stall ${stallId}`);
      }

      const currentStock = productRes.rows[0].stock;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      // Desconto de estoque atômico
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE product_id = $2',
        [item.quantity, item.productId]
      );

      total += item.quantity * item.unitPrice;
    }

    const code = `TKT-${ticketId.substring(0, 6).toUpperCase()}`;

    // Insere o ticket (agora com campos adicionais mapeados na migração 004)
    await client.query(
      `INSERT INTO tickets (ticket_id, code, total, status, operator_id, stall_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ticketId, code, total, 'validated', operatorId, stallId]
    );

    // Insere itens do ticket
    for (const item of items) {
      await client.query(
        'INSERT INTO ticket_items (ticket_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [ticketId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function revertTicket(ticketId: string): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Bloqueia o ticket contra estornos concorrentes
    const ticketRes = await client.query(
      'SELECT status FROM tickets WHERE ticket_id = $1 FOR UPDATE',
      [ticketId]
    );

    if (ticketRes.rowCount === 0) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    if (ticketRes.rows[0].status !== 'validated') {
      throw new Error(`Ticket ${ticketId} cannot be reverted (status: ${ticketRes.rows[0].status})`);
    }

    // Puxa itens
    const itemsRes = await client.query(
      'SELECT product_id, quantity FROM ticket_items WHERE ticket_id = $1',
      [ticketId]
    );

    // Retorna estoque atômico
    for (const item of itemsRes.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Atualiza o ticket
    await client.query(
      'UPDATE tickets SET status = $1 WHERE ticket_id = $2',
      ['reverted', ticketId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
