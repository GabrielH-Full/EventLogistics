const BASE_URL = 'http://localhost:4000/api';
let adminToken = '';
let operatorToken = '';

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
  console.log('--- Iniciando Testes de Integração ---');

  // 1. Obter tokens (Assumindo admin / admin123)
  try {
    adminToken = await login('admin', 'admin123');
    if (!adminToken) throw new Error('Token vazio');
    console.log('✅ Token Admin obtido.');
  } catch (e) {
    console.log('❌ Falha ao obter token Admin. Verifique se o server está rodando.');
    return;
  }
  
  try {
    // Create an operator user
    await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ username: 'test_op', password: 'op123', role: 'operator' })
    });
    operatorToken = await login('test_op', 'op123');
    console.log('✅ Token Operator obtido.');
  } catch (e) {
    console.log('⚠️ Token Operator não obtido (ignorando teste de operador).');
  }

  // Teste 6.15: Todas as rotas admin sem token -> 401
  const res401 = await fetch(`${BASE_URL}/users`);
  if (res401.status === 401) {
    console.log('✅ Teste 6.15: GET /api/users sem token retornou 401 Unauthorized');
  } else {
    console.log(`❌ Teste 6.15 falhou. Status: ${res401.status}`);
  }

  // Teste 6.16: Rotas admin com token operator -> 403
  if (operatorToken) {
    const res403 = await fetch(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${operatorToken}` }});
    if (res403.status === 403) {
      console.log('✅ Teste 6.16: GET /api/users com token de operator retornou 403 Forbidden');
    } else {
      console.log(`❌ Teste 6.16 falhou. Status: ${res403.status}`);
    }
  }

  // Teste 6.16: Rotas admin com token operator -> 403
  if (operatorToken) {
    const res403 = await fetch(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${operatorToken}` }});
    if (res403.status === 403) {
      console.log('✅ Teste 6.16: GET /api/users com token de operator retornou 403 Forbidden');
    } else {
      console.log(`❌ Teste 6.16 falhou. Status: ${res403.status}`);
    }
  }

  // Teste 6.12: POST /api/users com username duplicado -> 409
  // O usuário "admin" já existe, vamos tentar criar um igual
  const res409User = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ username: 'admin', password: '123', role: 'admin' })
  });
  if (res409User.status === 409) {
    console.log('✅ Teste 6.12: POST /api/users duplicado retornou 409 Conflict');
  } else {
    console.log(`❌ Teste 6.12 falhou. Status: ${res409User.status}`);
  }

  // Teste 6.14: POST /api/products com price = -1 -> 400
  const res400Product = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Teste -1', parent_type: 'food', stall_id: 1, category_id: 1, price: -1, is_active: true })
  });
  if (res400Product.status === 400) {
    console.log('✅ Teste 6.14: POST /api/products price=-1 retornou 400 Bad Request');
  } else {
    console.log(`❌ Teste 6.14 falhou. Status: ${res400Product.status}`);
  }

  // Teste 6.13: DELETE /api/stalls/:id com pedidos ativos -> 409
  // Primeiro criamos uma barraca e um produto
  const createStall = await fetch(`${BASE_URL}/stalls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Barraca Teste 409', type: 'Test', icon: '?', user_ids: [] })
  });
  const stallData = await createStall.json() as any;
  
  if (stallData && stallData.id) {
    const createProd = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Produto 409', parent_type: 'food', stall_id: stallData.id, price: 10, is_active: true })
    });
    
    // Simulate active ticket for this product (just create ticket)
    const prodData = await createProd.json() as any;
    if (prodData && prodData.id) {
      await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ items: [{ productId: prodData.id, quantity: 1 }] })
      });
      
      const res409Stall = await fetch(`${BASE_URL}/stalls/${stallData.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res409Stall.status === 409) {
        console.log('✅ Teste 6.13: DELETE /api/stalls/:id (barraca com produtos ativos/pedidos) retornou 409 Conflict');
      } else {
        console.log(`❌ Teste 6.13 falhou. Status: ${res409Stall.status}`);
      }
    }
  }

  console.log('--- Testes Concluídos ---');
}

runTests().catch(console.error);
