import { db } from './src/db';
async function run() {
  const users = await db.query("SELECT * FROM users WHERE username = 'op_e2e'");
  console.log('User:', users.rows[0]);
  const su = await db.query('SELECT * FROM stall_users WHERE user_id = $1', [users.rows[0].user_id]);
  console.log('Stall User:', su.rows);
  const auth = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'op_e2e', password: 'op' })
  });
  console.log('Auth login:', await auth.json());
  process.exit(0);
}
run();
