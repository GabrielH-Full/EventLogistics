import { Pool, PoolClient } from 'pg';
import { ProductCategoryRow } from '../types/db';

export class CategoryRepository {
  constructor(private pool: Pool) {}

  private getExecutor(client?: PoolClient): Pool | PoolClient {
    return client || this.pool;
  }

  async findAll(parentType?: string, client?: PoolClient): Promise<ProductCategoryRow[]> {
    let query = 'SELECT category_id as id, * FROM product_categories';
    const params: any[] = [];

    if (parentType === 'food' || parentType === 'drink') {
      query += ' WHERE parent_type = $1';
      params.push(parentType);
    }

    query += ' ORDER BY name ASC';
    const res = await this.getExecutor(client).query(query, params);
    return res.rows;
  }

  async findById(categoryId: string, client?: PoolClient): Promise<ProductCategoryRow | null> {
    const res = await this.getExecutor(client).query(
      'SELECT * FROM product_categories WHERE category_id = $1',
      [categoryId]
    );
    return res.rows[0] || null;
  }

  async create(data: { name: string; parentType: string }, client?: PoolClient): Promise<ProductCategoryRow> {
    const res = await this.getExecutor(client).query(
      'INSERT INTO product_categories (name, parent_type) VALUES ($1, $2) RETURNING *',
      [data.name, data.parentType]
    );
    return res.rows[0];
  }

  async delete(categoryId: string, client?: PoolClient): Promise<string | null> {
    const res = await this.getExecutor(client).query(
      'DELETE FROM product_categories WHERE category_id = $1 RETURNING category_id',
      [categoryId]
    );
    return res.rows[0]?.category_id || null;
  }
}
