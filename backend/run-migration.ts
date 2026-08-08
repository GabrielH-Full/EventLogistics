import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const db = new Pool({
  connectionString: 'postgres://eventlogistics:eventlogistics_secret@localhost:5433/eventlogistics_db'
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '004_ticket_validation_fields.sql'), 'utf-8');
    console.log('Running migration 004...');
    await db.query(sql);
    console.log('Migration 004 applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  }
}

run();
