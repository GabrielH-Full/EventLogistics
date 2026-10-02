import { Pool, PoolClient } from 'pg';
import { ProductRow, ProductFilters } from '../types/db';

export class ProductRepository {
  constructor(private pool: Pool) {}

  private getExecutor(client?: PoolClient): Pool | PoolClient {
    return client || this.pool;
  }

  async findById(id: string, client?: PoolClient): Promise<ProductRow | null> {
    const res = await this.getExecutor(client).query(
      'SELECT * FROM products WHERE product_id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  async findByIdForUpdate(id: string, client: PoolClient): Promise<ProductRow | null> {
    const res = await client.query(
      'SELECT * FROM products WHERE product_id = $1 FOR UPDATE',
      [id]
    );
    return res.rows[0] || null;
  }

  async findByStallAndIdForUpdate(productId: string, stallId: string, client: PoolClient): Promise<ProductRow | null> {
    const res = await client.query(
      'SELECT * FROM products WHERE product_id = $1 AND stall_id = $2 FOR UPDATE',
      [productId, stallId]
    );
    return res.rows[0] || null;
  }

  async findByIdWithDetails(id: string, client?: PoolClient): Promise<any | null> {
    const res = await this.getExecutor(client).query(
      `SELECT p.*, s.name as stall_name, c.name as subcategory_name, c.parent_type
       FROM products p 
       LEFT JOIN stalls s ON p.stall_id = s.stall_id
       LEFT JOIN product_categories c ON p.category_id = c.category_id
       WHERE p.product_id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async decrementStock(productId: string, quantity: number, client: PoolClient): Promise<void> {
    await client.query(
      'UPDATE products SET stock = stock - $1 WHERE product_id = $2',
      [quantity, productId]
    );
  }

  async incrementStock(productId: string, amount: number, client?: PoolClient): Promise<ProductRow | null> {
    const res = await this.getExecutor(client).query(
      'UPDATE products SET stock = stock + $1 WHERE product_id = $2 RETURNING *',
      [amount, productId]
    );
    return res.rows[0] || null;
  }

  async incrementStockWithLimit(productId: string, amount: number, client?: PoolClient): Promise<ProductRow | null> {
    const res = await this.getExecutor(client).query(
      'UPDATE products SET stock = LEAST(max_stock, stock + $1) WHERE product_id = $2 RETURNING *',
      [amount, productId]
    );
    return res.rows[0] || null;
  }

  async resetStockByStall(stallId: string, client?: PoolClient): Promise<ProductRow[]> {
    const executor = this.getExecutor(client);
    await executor.query('UPDATE products SET stock = 0 WHERE stall_id = $1', [stallId]);
    const res = await executor.query('SELECT * FROM products WHERE stall_id = $1 ORDER BY name', [stallId]);
    return res.rows;
  }

  async findAll(filters: ProductFilters = {}): Promise<{ rows: any[]; total: number }> {
    const search = filters.search || '';
    const isActive = filters.isActive;
    const stallId = filters.stallId;
    const category = filters.category;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const queryArgs: any[] = [];
    const whereClauses: string[] = [];

    if (search) {
      whereClauses.push(`LOWER(p.name) LIKE LOWER($${queryArgs.length + 1})`);
      queryArgs.push(`%${search}%`);
    }
    if (isActive !== undefined) {
      whereClauses.push(`p.is_active = $${queryArgs.length + 1}`);
      queryArgs.push(isActive);
    }
    if (stallId) {
      whereClauses.push(`p.stall_id = $${queryArgs.length + 1}`);
      queryArgs.push(stallId);
    }
    if (category) {
      whereClauses.push(`c.parent_type = $${queryArgs.length + 1}`);
      queryArgs.push(category);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const joinString = category ? `LEFT JOIN product_categories c ON p.category_id = c.category_id` : '';

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM products p ${joinString} ${whereString}`,
      queryArgs
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const listQueryArgs = [...queryArgs, limit, offset];
    const limitIdx = listQueryArgs.length - 1;
    const offsetIdx = listQueryArgs.length;

    const dataResult = await this.pool.query(
      `SELECT p.product_id as id, p.*, s.name as stall_name, c.name as subcategory_name, c.parent_type
       FROM products p 
       LEFT JOIN stalls s ON p.stall_id = s.stall_id
       LEFT JOIN product_categories c ON p.category_id = c.category_id
       ${whereString}
       ORDER BY p.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listQueryArgs
    );

    return { rows: dataResult.rows, total };
  }

  async create(data: {
    productId: string;
    stallId: string;
    categoryId: string;
    name: string;
    price: number;
    isActive?: boolean;
    stock?: number;
    maxStock?: number;
    unit?: string;
    image?: string;
    category?: string;
  }, client?: PoolClient): Promise<ProductRow> {
    const res = await this.getExecutor(client).query(
      `INSERT INTO products 
      (product_id, stall_id, category_id, name, price, is_active, updated_at, stock, max_stock, unit, image, category) 
      VALUES ($1, $2, $3, $4, $5, $6, now(), $7, $8, $9, $10, $11) RETURNING *`,
      [
        data.productId,
        data.stallId,
        data.categoryId,
        data.name,
        data.price,
        data.isActive ?? true,
        data.stock ?? 0,
        data.maxStock ?? 100,
        data.unit ?? 'un',
        data.image ?? 'food.png',
        data.category ?? 'Salgados'
      ]
    );
    return res.rows[0];
  }

  async update(id: string, data: {
    name: string;
    stallId: string;
    categoryId: string;
    price: number;
    isActive?: boolean;
  }, client?: PoolClient): Promise<ProductRow | null> {
    const res = await this.getExecutor(client).query(
      `UPDATE products 
       SET name=$1, stall_id=$2, category_id=$3, price=$4, is_active=$5, updated_at=now() 
       WHERE product_id=$6 RETURNING *`,
      [data.name, data.stallId, data.categoryId, data.price, data.isActive ?? true, id]
    );
    return res.rows[0] || null;
  }

  async toggleStatus(id: string, client?: PoolClient): Promise<ProductRow | null> {
    const executor = this.getExecutor(client);
    const checkResult = await executor.query('SELECT is_active FROM products WHERE product_id = $1', [id]);
    if (checkResult.rows.length === 0) return null;

    const current = checkResult.rows[0].is_active;
    const res = await executor.query(
      'UPDATE products SET is_active=$1, updated_at=now() WHERE product_id=$2 RETURNING *',
      [!current, id]
    );
    return res.rows[0] || null;
  }

  async delete(id: string, client?: PoolClient): Promise<ProductRow | null> {
    const res = await this.getExecutor(client).query(
      'DELETE FROM products WHERE product_id = $1 RETURNING *',
      [id]
    );
    return res.rows[0] || null;
  }

  async hasTicketHistory(productId: string, client?: PoolClient): Promise<boolean> {
    const res = await this.getExecutor(client).query(
      'SELECT COUNT(*) FROM ticket_items WHERE product_id = $1',
      [productId]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  }

  async countByCategoryId(categoryId: string, client?: PoolClient): Promise<number> {
    const res = await this.getExecutor(client).query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [categoryId]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async countByStallId(stallId: string, client?: PoolClient): Promise<number> {
    const res = await this.getExecutor(client).query(
      'SELECT COUNT(*) FROM products WHERE stall_id = $1',
      [stallId]
    );
    return parseInt(res.rows[0].count, 10);
  }
}
