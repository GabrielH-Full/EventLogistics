import { Pool, PoolClient } from 'pg';
import { TicketRow, TicketItemRow, CreateTicketInput, TicketStatus } from '../types/db';

export class TicketRepository {
  constructor(private pool: Pool) {}

  private getExecutor(client?: PoolClient): Pool | PoolClient {
    return client || this.pool;
  }

  async findById(ticketId: string, client?: PoolClient): Promise<TicketRow | null> {
    const res = await this.getExecutor(client).query(
      'SELECT * FROM tickets WHERE ticket_id = $1',
      [ticketId]
    );
    return res.rows[0] || null;
  }

  async findByIdForUpdate(client: PoolClient, ticketId: string): Promise<TicketRow | null> {
    const res = await client.query(
      'SELECT * FROM tickets WHERE ticket_id = $1 FOR UPDATE',
      [ticketId]
    );
    return res.rows[0] || null;
  }

  async createWithItems(client: PoolClient, input: CreateTicketInput): Promise<TicketRow> {
    const now = new Date();
    const res = await client.query(
      `INSERT INTO tickets (ticket_id, code, total, status, created_at, operator_id, stall_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.ticketId,
        input.code,
        input.total,
        'pending',
        now.toISOString(),
        input.operatorId || null,
        input.stallId || null
      ]
    );

    for (const item of input.items) {
      await client.query(
        'INSERT INTO ticket_items (ticket_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [input.ticketId, item.productId, item.quantity, item.unitPrice]
      );
    }

    return res.rows[0];
  }

  async updateStatus(client: PoolClient, ticketId: string, status: TicketStatus): Promise<TicketRow | null> {
    const res = await client.query(
      'UPDATE tickets SET status = $1 WHERE ticket_id = $2 RETURNING *',
      [status, ticketId]
    );
    return res.rows[0] || null;
  }

  async findItemsByTicketId(ticketId: string, client?: PoolClient): Promise<TicketItemRow[]> {
    const res = await this.getExecutor(client).query(
      `SELECT ti.ticket_item_id, ti.ticket_id, ti.product_id, ti.quantity, ti.unit_price, p.name, p.category 
       FROM ticket_items ti 
       LEFT JOIN products p ON ti.product_id = p.product_id 
       WHERE ti.ticket_id = $1`,
      [ticketId]
    );
    return res.rows;
  }

  async hasItemsFromStall(client: PoolClient, ticketId: string, stallId: string): Promise<boolean> {
    const res = await client.query(
      `SELECT COUNT(*) 
       FROM ticket_items ti 
       JOIN products p ON ti.product_id = p.product_id 
       WHERE ti.ticket_id = $1 AND p.stall_id = $2`,
      [ticketId, stallId]
    );
    return Number(res.rows[0].count) > 0;
  }
}
