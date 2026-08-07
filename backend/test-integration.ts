import { io } from 'socket.io-client';
import { db } from './src/db';

const BASE_URL = 'http://localhost:4000/api';
let adminToken = '';
let operatorToken = '';
let stallId = '';
let productId = '';

async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json() as any;
  return data.token;
}

async function runTests() {
  console.log('--- Iniciando Testes E2E de Migração ---');

  adminToken = await login('admin', 'admin123');
  if (!adminToken) {
    console.error('Falha ao obter token admin');
    return;
  }
  console.log('✅ Token Admin obtido.');

  // Create Operator and Stall for testing
  try {
    const stallRes = await fetch(`${BASE_URL}/stalls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Barraca E2E', type: 'Test' })
    });
    const stallData = await stallRes.json() as any;
    stallId = stallData.data.stall_id;

    await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ username: 'op_e2e_2', password: 'op', role: 'operator', stall_ids: [stallId] })
    });
    operatorToken = await login('op_e2e_2', 'op');
    console.log('✅ Barraca e Operador criados.');
  } catch (e) {
    console.error('Erro no setup', e);
  }

  // Create Product for testing
  try {
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Coxinha E2E', stall_id: stallId, category_id: 1, price: 10, is_active: true })
    });
    const prodData = await prodRes.json() as any;
    productId = prodData.data.product_id;
    
    // Add stock = 2 to product
    const prodCall = await fetch(`${BASE_URL}/products/${productId}/production`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${operatorToken}` },
      body: JSON.stringify({ amount: 2 })
    });
    if (prodCall.status !== 200) {
      console.error('❌ Erro no /production:', prodCall.status, await prodCall.text());
    } else {
      console.log('✅ Produto com estoque (2) criado.');
    }
  } catch(e) {
    console.error('Erro criar produto', e);
  }

  // 9.3 Testar GET /api/state — retorna dados do banco
  const stateRes = await fetch(`${BASE_URL}/state`, { headers: { Authorization: `Bearer ${adminToken}` }});
  const stateData = await stateRes.json() as any;
  if (stateData.products && stateData.stalls) {
    console.log('✅ Teste 9.3: GET /api/state retornou os dados corretamente');
  } else {
    console.error('❌ Teste 9.3 falhou', stateData);
  }

  // 9.4 Testar POST /api/tickets com estoque suficiente
  let ticketId1 = '';
  const ticket1Res = await fetch(`${BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ items: [{ productId, quantity: 1 }] })
  });
  if (ticket1Res.status === 201) {
    const tk1 = await ticket1Res.json() as any;
    ticketId1 = tk1.ticket.id;
    const pCheck = await db.query('SELECT stock FROM products WHERE product_id = $1', [productId]);
    if (pCheck.rows[0].stock === 1) {
      const aCheck = await db.query("SELECT * FROM audit_logs WHERE action = 'TICKET_CREATED' ORDER BY created_at DESC LIMIT 1");
      if (aCheck.rows.length === 1) {
        console.log('✅ Teste 9.4: POST /api/tickets sucesso, decrementou banco e logou audit');
      }
    }
  } else {
    console.error('❌ Teste 9.4 falhou', ticket1Res.status, await ticket1Res.text());
  }

  // 9.6 Testar venda concorrente (2 requisições simultâneas, estoque = 1):
  const [r1, r2] = await Promise.all([
    fetch(`${BASE_URL}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ items: [{ productId, quantity: 1 }] }) }),
    fetch(`${BASE_URL}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ items: [{ productId, quantity: 1 }] }) })
  ]);
  
  const statuses = [r1.status, r2.status].sort();
  if (statuses[0] === 201 && (statuses[1] === 409 || statuses[1] === 400)) {
    console.log('✅ Teste 9.6: Venda concorrente evitou overselling (1 sucesso, 1 falha)');
  } else {
    console.error('❌ Teste 9.6 falhou', statuses);
  }

  // 9.5 Testar POST /api/tickets com estoque insuficiente (agora estoque é 0)
  const ticketFailRes = await fetch(`${BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ items: [{ productId, quantity: 1 }] })
  });
  if (ticketFailRes.status === 409 || ticketFailRes.status === 400) { // The logic returns 409 if < quantity
    console.log('✅ Teste 9.5: Venda sem estoque retornou erro 409');
  }

  // 9.7 Testar POST /api/tickets/:id/validate por operador correto
  const valRes = await fetch(`${BASE_URL}/tickets/${ticketId1}/validate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${operatorToken}` }
  });
  if (valRes.status === 200) {
    console.log('✅ Teste 9.7: Validate ticket por operador dono retornou 200');
  } else {
    console.error('❌ Teste 9.7 falhou', valRes.status);
  }

  // 9.8 Testar POST /api/tickets/:id/validate por operador errado
  try {
    // create another operator in another stall
    const stallRes2 = await fetch(`${BASE_URL}/stalls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Barraca Inimiga', type: 'Test' })
    });
    const stallData2 = await stallRes2.json() as any;
    
    await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ username: 'op_inimigo_2', password: 'op', role: 'operator', stall_ids: [stallData2.data.stall_id] })
    });
    const enemyToken = await login('op_inimigo_2', 'op');
    
    const valFailRes = await fetch(`${BASE_URL}/tickets/${ticketId1}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${enemyToken}` }
    });
    if (valFailRes.status === 403) {
      console.log('✅ Teste 9.8: Validate ticket por operador errado retornou 403');
    } else {
      console.error('❌ Teste 9.8 falhou', valFailRes.status);
    }
  } catch (e) {
    console.error('Erro teste 9.8', e);
  }

  // 9.9 Testar WebSocket
  console.log('Conectando WebSocket...');
  const socket = io('http://localhost:4000');
  
  socket.on('state:update', (state) => {
    if (state.products && state.stalls) {
      console.log('✅ Teste 9.9: Recebeu state:update no WebSocket');
      socket.disconnect();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error('❌ Teste 9.9 falhou (timeout WebSocket)');
    process.exit(1);
  }, 5000);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
