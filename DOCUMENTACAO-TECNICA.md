# Documentação técnica — EventLogistics

Este documento explica **tudo** que foi criado ou alterado na reorganização do projeto: cada arquivo, o que ele faz, como se conecta com o resto, as regras de negócio e o modelo de dados. O objetivo é que você consiga abrir qualquer arquivo do projeto e saber exatamente por que ele existe e o que pode quebrar se você mexer nele.

---

## 1. Visão geral da arquitetura

Antes, tudo (produtos, tickets, estoque) vivia como estado local dentro de um único app React, sem separação de acesso e sem persistência real. Qualquer pessoa via as 4 telas (`CentralDashboardView`, `CustomerTicketView`, `StallOperatorView`, `SalesValidatorView`) no mesmo lugar.

Agora o projeto é dividido em duas partes que conversam por rede:

```
┌─────────────────────┐         HTTP (REST)          ┌──────────────────────┐
│                      │ ────────────────────────────▶│                      │
│   FRONTEND (React)   │                               │   BACKEND (Node)     │
│  Conta ADM ou Barraca│ ◀──────────────────────────── │  Fonte única de      │
│                      │      WebSocket (tempo real)   │  verdade dos dados   │
└─────────────────────┘                                └──────────┬───────────┘
                                                                    │
                                                                    ▼
                                                          data.json (persistência)
```

- **O backend nunca confia no frontend.** Toda regra de negócio (estoque, permissão, validação) é checada no servidor. O frontend só manda a intenção ("quero vender isso", "quero validar esse ticket") e mostra o resultado.
- **O frontend nunca guarda estado que possa ficar desatualizado.** Ele carrega o estado atual ao abrir a tela (`GET /api/state`) e depois só reage a eventos `state:update` do WebSocket. Isso é o que garante que caixa e barraca nunca fiquem dessincronizados.

---

## 2. Estrutura de pastas

```
eventlogistics/
├── README.md                    → como rodar o projeto
├── DOCUMENTACAO-TECNICA.md       → este arquivo
│
├── backend/
│   ├── package.json
│   ├── .env.example              → copiar para .env antes de rodar
│   ├── data.json                 → gerado automaticamente na 1ª execução (não versionar)
│   └── src/
│       ├── server.js             → ponto de entrada, monta tudo
│       ├── db.js                 → estado em memória + leitura/escrita em data.json
│       ├── seedData.js           → dados iniciais (produtos, barracas, usuários)
│       ├── auth.js               → hash de senha e geração/validação de JWT
│       ├── middleware.js         → requireAuth / requireRole
│       ├── socket.js             → WebSocket (Socket.IO) e broadcast de estado
│       └── routes/
│           ├── authRoutes.js     → POST /api/auth/login, GET /api/auth/me
│           ├── stateRoutes.js    → GET /api/state
│           ├── ticketRoutes.js   → POST /api/tickets, POST /api/tickets/:id/validate
│           └── productRoutes.js  → POST /api/products/:id/production, POST /api/stalls/:id/reset
│
└── frontend/
    └── src/
        ├── types.ts               → tipos TypeScript compartilhados
        ├── data.ts                → só imagens decorativas (dados reais vêm do backend)
        ├── App.tsx                → roteador raiz (login → ADM ou Barraca)
        ├── main.tsx                → bootstrap do React (não alterado)
        │
        ├── api/
        │   ├── client.ts          → chamadas REST para o backend
        │   ├── socket.ts          → conexão WebSocket
        │   └── useAppData.ts      → hook que mantém products/tickets/stalls sincronizados
        │
        ├── auth/
        │   ├── AuthContext.tsx    → contexto de autenticação (login/logout/sessão)
        │   └── LoginView.tsx      → tela de login
        │
        ├── admin/
        │   └── AdminApp.tsx       → área da conta ADM (junta 2 telas + navegação)
        │
        ├── stall/
        │   └── StallApp.tsx       → área da conta Barraca (junta 2 telas + navegação)
        │
        └── components/            → as 4 telas originais, adaptadas
            ├── CustomerTicketView.tsx
            ├── CentralDashboardView.tsx
            ├── StallOperatorView.tsx
            └── SalesValidatorView.tsx
```

---

## 3. Backend — arquivo por arquivo

### 3.1 `backend/src/server.js` — ponto de entrada

O que faz:
1. Carrega variáveis de ambiente do `.env` (porta, segredo do JWT, origem permitida por CORS).
2. Cria o app Express, liga `cors` e `express.json()`.
3. Registra as rotas:
   - `/api/auth` → `authRoutes.js`
   - `/api/state` → `stateRoutes.js`
   - `/api/tickets` → `ticketRoutes.js`
   - `/api` → `productRoutes.js` (por isso os caminhos dentro desse arquivo já começam com `/products/...` e `/stalls/...`)
4. Cria um `http.Server` por cima do Express (necessário porque o Socket.IO precisa do servidor HTTP bruto, não só do Express) e inicializa o WebSocket com `initSocket`.
5. Sobe o servidor na porta definida em `PORT` (padrão `4000`).

Se você for adicionar uma rota nova, é aqui que ela precisa ser registrada com `app.use(...)`.

### 3.2 `backend/src/seedData.js` — dados iniciais

Contém:
- `INITIAL_PRODUCTS` — lista de produtos, cada um com `stallId` dizendo a qual barraca pertence.
- `INITIAL_STALLS` — lista de barracas (id, nome, ícone).
- `INITIAL_TICKETS` — alguns tickets de exemplo para não abrir o sistema vazio.
- `buildInitialUsers()` — cria os 4 usuários de demonstração (`admin`, `pastel`, `churrasco`, `doces`) já com a senha "hasheada" (criptografada) via `bcrypt`.
- `buildInitialState()` — junta tudo isso num objeto só, usado na primeira vez que o servidor roda.

**É aqui que você mexe para:**
- Adicionar um produto novo → adicione um objeto em `INITIAL_PRODUCTS` com um `stallId` existente.
- Adicionar uma barraca nova → adicione em `INITIAL_STALLS` **e** crie um usuário para ela em `buildInitialUsers()`.
- Trocar as senhas de demonstração → troque os valores em `plainPasswords`.

⚠️ Esse arquivo só é lido **na primeira vez** que o backend roda (quando `data.json` ainda não existe). Depois disso, quem manda é o `data.json`. Se você mudar o `seedData.js` depois que o sistema já rodou, apague o `backend/data.json` para forçar recriar o estado do zero (isso apaga vendas e progresso já feitos).

### 3.3 `backend/src/db.js` — banco de dados

Não usamos um banco de dados tradicional (Postgres, MySQL etc). Usamos um **arquivo JSON como banco de dados simples**, o que é suficiente para o tamanho desse projeto (um evento, poucas barracas, baixo volume). Ver seção 5 para o motivo dessa escolha e como trocar por um banco de verdade no futuro.

O que faz:
- `load()` — na inicialização, lê `data.json`. Se o arquivo não existir (primeira execução), chama `buildInitialState()` do `seedData.js` e salva.
- `state` — objeto que fica em memória durante toda a execução do servidor. Todas as rotas leem e escrevem direto nesse objeto.
- `save()` — grava o `state` atual de volta no `data.json`. **Toda rota que muda alguma coisa (venda, produção, validação) precisa chamar `save()` no final**, senão a mudança não sobrevive a um restart do servidor.
- `publicState()` — retorna uma cópia do estado *sem* o campo `users` (e sem `passwordHash`), porque isso nunca deve ser exposto ao frontend.

### 3.4 `backend/src/auth.js` — autenticação

Duas responsabilidades:
- `checkPassword(plain, hash)` — compara a senha digitada com o hash salvo, usando `bcrypt.compareSync`.
- `signToken(user)` / `verifyToken(token)` — gera e valida o JWT (JSON Web Token), que é o "crachá" que o frontend guarda depois do login e manda em toda requisição.

O token contém: `sub` (id do usuário), `username`, `role` (`admin` ou `stall`), `stallId` (só preenchido se for `stall`) e `displayName`. **Nunca** contém a senha ou o hash.

O segredo usado para assinar o token vem de `JWT_SECRET` no `.env`. **Troque esse valor antes de usar em produção** — se alguém souber o segredo, consegue forjar um token de admin.

### 3.5 `backend/src/middleware.js` — autorização

- `requireAuth` — middleware que verifica se veio um header `Authorization: Bearer <token>` válido. Se não vier, retorna `401`. Se vier, popula `req.user` com os dados do token para as rotas seguintes usarem.
- `requireRole('admin', 'stall')` — middleware que checa se `req.user.role` está na lista de papéis permitidos. Se não estiver, retorna `403`.

Toda rota protegida usa esses dois middlewares em sequência, por exemplo:
```js
router.post('/', requireAuth, requireRole('admin'), (req, res) => { ... })
```
Isso significa: "só deixa passar se tiver um token válido **e** se o papel for admin".

### 3.6 `backend/src/socket.js` — tempo real

- `initSocket(httpServer, corsOrigins)` — cria o servidor Socket.IO em cima do servidor HTTP. Quando um cliente conecta, ele já recebe o estado atual imediatamente (`socket.emit('state:update', publicState())`), então mesmo que o WebSocket demore um instante pra conectar, a tela não fica vazia.
- `broadcastState()` — função chamada por **todas** as rotas que alteram dados (venda, produção, validação, reset). Ela manda o estado atualizado para **todo mundo conectado** de uma vez (`io.emit`, não `socket.emit`). É essa função que faz o admin ver a venda aparecer na tela da barraca sem precisar recarregar a página.

### 3.7 Rotas

#### `authRoutes.js`
| Rota | Método | Papel exigido | O que faz |
|---|---|---|---|
| `/api/auth/login` | POST | nenhum (rota pública) | Recebe `{username, password}`, valida contra `state.users`, devolve `{token, user}` |
| `/api/auth/me` | GET | qualquer autenticado | Valida o token salvo e devolve os dados do usuário — usado para manter a sessão ao recarregar a página |

#### `stateRoutes.js`
| Rota | Método | Papel exigido | O que faz |
|---|---|---|---|
| `/api/state` | GET | qualquer autenticado | Devolve `{products, stalls, tickets}` — é o snapshot inicial que a tela carrega antes do WebSocket assumir |

#### `ticketRoutes.js`
| Rota | Método | Papel exigido | O que faz |
|---|---|---|---|
| `/api/tickets` | POST | `admin` | Cria um ticket novo (venda). Ver regra de negócio #1 abaixo. |
| `/api/tickets/:id/validate` | POST | `admin` ou `stall` | Marca um ticket como retirado. Ver regra de negócio #3 abaixo. |

#### `productRoutes.js`
| Rota | Método | Papel exigido | O que faz |
|---|---|---|---|
| `/api/products/:id/production` | POST | `stall` (só dono do produto) | Soma `amount` ao estoque de um produto (reabastecimento) |
| `/api/stalls/:stallId/reset` | POST | `stall` (só a própria) ou `admin` | Restaura o estoque *daquela barraca* para os valores de `seedData.js` |

---

## 4. Modelo de dados

O `data.json` guarda um único objeto com 4 listas:

```jsonc
{
  "products": [
    {
      "id": "pastel_carne",
      "name": "Pastel de Carne",
      "category": "Salgados",       // "Salgados" | "Doces" | "Bebidas"
      "price": 10.0,
      "stock": 45,                   // quantidade atual disponível
      "maxStock": 100,                // capacidade máxima (usado pra barra de progresso e limite de reposição)
      "unit": "100g",
      "stallId": "pastel",            // liga o produto à barraca dona
      "image": "https://..."
    }
  ],
  "stalls": [
    { "id": "pastel", "name": "Barraca do Pastel", "icon": "bakery_dining" }
  ],
  "tickets": [
    {
      "id": "ticket_1720000000000",
      "code": "#8492",
      "items": [
        { "productId": "pastel_carne", "name": "Pastel de Carne", "category": "Salgados", "price": 10.0, "quantity": 2 }
      ],
      "total": 20.0,
      "time": "Agora",
      "timestamp": "2026-07-11T02:00:00.000Z",
      "status": "pending"             // "pending" | "validated"
    }
  ],
  "users": [
    {
      "id": "user_admin",
      "username": "admin",
      "passwordHash": "$2a$10$...",   // nunca é enviado ao frontend
      "role": "admin",                 // "admin" | "stall"
      "stallId": null,                  // preenchido só para role "stall"
      "displayName": "Caixa Central"
    }
  ]
}
```

### Relacionamentos

- `product.stallId` → `stall.id` (um produto pertence a exatamente uma barraca)
- `ticket.items[].productId` → `product.id` (um ticket pode ter itens de **mais de uma barraca ao mesmo tempo** — ver limitação na seção 8)
- `user.stallId` → `stall.id` (só para usuários com `role: "stall"`; usuários `admin` têm `stallId: null`)

### Por que um arquivo JSON e não um banco de verdade?

Pra esse tamanho de projeto (evento local, poucas barracas, um servidor só, sem necessidade de consultas complexas) um arquivo é simples de entender, versionar e debugar — dá pra abrir e ler o estado inteiro num editor de texto. Se o projeto crescer (múltiplos eventos, histórico de longo prazo, múltiplos servidores rodando ao mesmo tempo), o próximo passo natural é trocar `db.js` por um banco real (Postgres ou SQLite, por exemplo) — como todo o resto do backend só fala com `state`, `save()` e `publicState()` através desse arquivo, a migração fica isolada ali, sem precisar mexer nas rotas.

---

## 5. Regras de negócio — o que resolve o problema original

Essa é a parte mais importante: o motivo de tudo isso existir.

### Regra 1 — Baixa automática de estoque na venda
**Onde:** `backend/src/routes/ticketRoutes.js`, rota `POST /api/tickets`

Antes de criar o ticket, o backend confere **todos os itens do carrinho** contra o estoque atual. Se qualquer item não tiver quantidade suficiente, a venda inteira é recusada com `409 Conflict` e uma mensagem dizendo qual produto e quanto resta. Só se tudo passar é que o estoque é debitado e o ticket é criado.

Isso substitui a ideia original de "botão de alerta manual" — a decisão de bloquear não depende de ninguém ter apertado um botão a tempo.

### Regra 2 — Permissão por papel em cada ação
**Onde:** `backend/src/middleware.js` (`requireRole`) usado em cada rota

| Ação | Quem pode |
|---|---|
| Vender ticket | só `admin` |
| Reabastecer produto | só `stall`, e só o dono daquele produto |
| Validar ticket | `stall` dono de pelo menos um item do ticket, ou `admin` |
| Resetar estoque de uma barraca | a própria `stall`, ou `admin` |

Isso impede, por exemplo, a Barraca do Pastel mexer no estoque da Barraca do Churrasco.

### Regra 3 — Validação de ticket restrita à barraca dona
**Onde:** `backend/src/routes/ticketRoutes.js`, rota `POST /api/tickets/:id/validate`

Quando quem está validando é uma conta `stall`, o backend confere se **pelo menos um item** do ticket pertence a essa barraca (`product.stallId === req.user.stallId`). Se não pertencer, retorna `403`.

### Regra 4 — Tempo real obrigatório após qualquer mutação
**Onde:** toda rota que muda dados chama `broadcastState()` no final (ver `socket.js`)

Depois de vender, reabastecer ou validar, o novo estado é mandado via WebSocket pra **todo mundo conectado**, não só pra quem fez a ação. É isso que faz o painel do admin e a tela da barraca ficarem sempre iguais sem precisar de F5.

### Regra 5 — Limite de reposição
**Onde:** `backend/src/routes/productRoutes.js`, rota `POST /api/products/:id/production`

`product.stock = Math.min(product.maxStock, product.stock + amount)` — o estoque nunca ultrapassa o `maxStock` cadastrado, mesmo que a barraca tente reabastecer mais de uma vez seguida.

---

## 6. Frontend — arquivo por arquivo

### 6.1 `src/types.ts`
Tipos TypeScript compartilhados por todo o frontend: `Product`, `Stall`, `Ticket`, `TicketItem`, `UserRole`, `AuthUser`. Se o backend passar a devolver um campo novo em algum desses objetos, é aqui que você adiciona o campo no tipo correspondente.

### 6.2 `src/api/client.ts`
Camada única de comunicação HTTP com o backend. Toda chamada de rede do frontend passa por aqui — nenhum componente usa `fetch` diretamente. Funções disponíveis: `login`, `me`, `getState`, `createTicket`, `validateTicket`, `addProduction`, `resetStallStock`.

Cada chamada:
1. Pega o token salvo no `localStorage` (`eventlogistics_token`) e manda no header `Authorization`.
2. Se a resposta não for `ok`, lança um `ApiError` com a mensagem que o backend mandou — assim os componentes conseguem mostrar o erro certo pro usuário (ex: "Estoque insuficiente para Pastel de Queijo").

**Se você criar uma rota nova no backend, adicione a função correspondente aqui** — é o único lugar que precisa saber o caminho exato da URL.

### 6.3 `src/api/socket.ts`
Cria (uma única vez, `singleton`) a conexão WebSocket com o backend usando `socket.io-client`. Em desenvolvimento, o `vite.config.ts` faz proxy de `/socket.io` pro backend, então não precisa configurar URL nenhuma.

### 6.4 `src/api/useAppData.ts`
Hook central de dados. Ele:
1. Ao montar, chama `api.getState()` pra carregar o snapshot inicial.
2. Assina o evento `state:update` do WebSocket — toda vez que chega um evento, atualiza `products`, `tickets` e `stalls` no estado local do React.
3. Devolve `{ products, stalls, tickets, loading, error, refresh }`.

Tanto `AdminApp` quanto `StallApp` usam esse mesmo hook — é o que garante que os dois lados sempre veem a mesma informação, sem duplicar lógica de sincronização.

### 6.5 `src/auth/AuthContext.tsx`
Contexto React que guarda `user` (dados do usuário logado, decodificados do token) e expõe `login()` / `logout()`.

- `login(username, password)` chama `api.login`, salva o token no `localStorage` e guarda o usuário no estado.
- Ao carregar a página, tenta restaurar a sessão chamando `api.me()` com o token salvo — se o token ainda for válido, o usuário continua logado mesmo depois de recarregar a página.
- `logout()` limpa o token e o estado.

### 6.6 `src/auth/LoginView.tsx`
Formulário de usuário/senha. Mostra erro inline (vindo do `ApiError`) se o login falhar. Não faz nenhuma lógica de negócio — só chama `login()` do contexto.

### 6.7 `src/App.tsx`
Roteador raiz, bem enxuto:
```
Carregando sessão? → tela de loading
Sem usuário logado? → <LoginView />
role === 'admin'?   → <AdminApp />
role === 'stall'?   → <StallApp />
```

### 6.8 `src/admin/AdminApp.tsx` — área da conta ADM
Junta duas telas com uma barra de navegação por cima:
- Aba **"Vender Ticket"** → `CustomerTicketView`
- Aba **"Painel Geral"** → `CentralDashboardView`

Responsabilidades que vivem aqui (e não dentro das próprias telas):
- Estado do carrinho (`cart`) — um objeto `{ [productId]: quantidade }`.
- `handleAddToCart`, `handleRemoveFromCart`, `handleUpdateCartQuantity` — lógica de carrinho, sempre respeitando o estoque local conhecido (o backend confere de novo na hora da venda, então é seguro).
- `handleCheckout` — chama `api.createTicket(items)`. Se der erro (ex: estoque insuficiente porque outra pessoa vendeu o último item um segundo antes), mostra um banner vermelho com a mensagem do backend.
- Botão "Sair" que chama `logout()`.

### 6.9 `src/stall/StallApp.tsx` — área da conta Barraca
Junta duas telas:
- Aba **"Produção / Estoque"** → `StallOperatorView`
- Aba **"Validar Tickets"** → `SalesValidatorView`

Responsabilidades daqui:
- Filtra `products` e `tickets` vindos do `useAppData()` para mostrar **só o que pertence à barraca logada** (`user.stallId`). Um ticket aparece pra essa barraca se tiver pelo menos um item dela.
- `handleAddProduction` → chama `api.addProduction`.
- `handleResetStallStock` → pede confirmação (`window.confirm`) e chama `api.resetStallStock`.
- `handleValidateTicket` → chama `api.validateTicket`.

### 6.10 `src/components/*.tsx` — as 4 telas originais

Essas telas continuam sendo só interface (visual + interação local), sem chamar a API diretamente — elas recebem dados prontos via `props` e chamam funções (`onAddToCart`, `onValidateTicket` etc) que o `AdminApp`/`StallApp` implementam.

| Componente | Antes | Depois |
|---|---|---|
| `CustomerTicketView` | Recebia produtos globais, checkout fake com `setTimeout` | Sem mudança de interface — só passou a receber dados reais vindos do backend via `AdminApp` |
| `CentralDashboardView` | Tinha 2 blocos de código copiados e colados, um pra "Barraca do Pastel" e outro pra "Barraca do Churrasco", escritos na mão | Agora usa `stalls.map(...)` — funciona pra **qualquer número de barracas** cadastradas no backend, sem precisar mexer no código quando uma barraca nova é criada |
| `StallOperatorView` | Filtrava produtos com `p.stallId === 'pastel'` fixo no código; contador de tickets somava um número mágico "+142" que não vinha de lugar nenhum | Recebe `stallId`/`stallName` como prop; filtra dinamicamente; removido o número fictício, agora é contagem real |
| `SalesValidatorView` | Mesma coisa: número fictício "+142" somado ao contador; texto "Pastéis e Bebidas" fixo | Recebe `stallName` como prop; contadores 100% reais; título dinâmico |

---

## 7. Fluxo completo de uma venda (passo a passo)

1. Operador do caixa (conta `admin`) adiciona itens ao carrinho em `CustomerTicketView` → estado local em `AdminApp`.
2. Clica em "Finalizar e Imprimir Ticket" → `AdminApp.handleCheckout()` roda.
3. `api.createTicket(items)` manda `POST /api/tickets` com o token JWT.
4. Backend (`ticketRoutes.js`):
   - `requireAuth` confere o token.
   - `requireRole('admin')` confere o papel.
   - Para cada item, confere se `product.stock >= quantity`. Se algum falhar, devolve `409` e para tudo.
   - Se passou: debita o estoque de cada produto, monta o ticket com status `pending`, salva no início da lista `state.tickets`.
   - `save()` grava tudo em `data.json`.
   - `broadcastState()` manda o novo estado pra todo mundo conectado via WebSocket.
5. No frontend, **qualquer tela aberta** (a do próprio admin, e a da(s) barraca(s) donas dos produtos vendidos) recebe o evento `state:update` e re-renderiza automaticamente:
   - `CentralDashboardView` mostra a barra de estoque menor.
   - `StallOperatorView`/`SalesValidatorView` da barraca correspondente mostram o novo ticket pendente na lista.
6. O operador da barraca abre a aba "Validar Tickets", vê o ticket novo, clica em "Validar".
7. `StallApp.handleValidateTicket()` → `POST /api/tickets/:id/validate` → backend confere se o ticket pertence à barraca → marca `status: 'validated'` → `broadcastState()` de novo.
8. Todo mundo vê o ticket como validado, em tempo real.

---

## 8. Limitações conhecidas (leia antes de "consertar" algo que já é esperado)

- **Ticket com itens de barracas diferentes:** hoje, se um ticket tiver, por exemplo, 1 pastel + 1 espetinho, ele aparece inteiro tanto pra Barraca do Pastel quanto pra Barraca do Churrasco, e qualquer uma das duas pode validar o ticket **inteiro** (não só a parte dela). Se isso for um problema real no seu evento, a solução é adicionar um `status` por item dentro de `ticket.items[]`, não só um `status` no ticket inteiro — isso exigiria mudanças em `ticketRoutes.js` (validação por item) e em `SalesValidatorView` (mostrar/validar item a item).
- **Sem modo offline:** se a internet do evento cair, ninguém consegue vender ou validar até a conexão voltar. Não há fila local nem sincronização posterior.
- **Sem tela de cadastro de usuários/barracas:** hoje isso é feito editando `backend/src/seedData.js` e apagando `data.json` (o que também reseta vendas). Pra um evento real com trocas frequentes de barraca, valeria a pena ter uma rota `POST /api/stalls` e `POST /api/users` restrita ao admin.
- **`data.json` como banco:** funciona bem para um evento por vez rodando num servidor só. Não escala para múltiplos eventos simultâneos ou múltiplas instâncias do servidor rodando em paralelo (nesse caso, cada instância teria seu próprio arquivo e os dados divergiriam).

---

## 9. Receitas rápidas para alterações comuns

### Adicionar uma barraca nova
1. Em `backend/src/seedData.js`, adicione o objeto em `INITIAL_STALLS`.
2. Adicione um usuário pra ela em `buildInitialUsers()` (`role: 'stall'`, `stallId` igual ao id da barraca nova).
3. Adicione os produtos dela em `INITIAL_PRODUCTS`, com `stallId` apontando pra ela.
4. Apague `backend/data.json` (se já existir) e reinicie o backend, para os dados novos do seed entrarem.
   - ⚠️ isso reseta o estado inteiro, incluindo vendas já feitas. Se quiser manter o histórico, edite `data.json` manualmente ao invés de apagar.

### Adicionar um produto novo numa barraca existente
Mesma coisa, mas só o passo 3 e 4 acima (não precisa mexer em barracas nem usuários).

### Mudar o limite de "estoque baixo" (hoje é ≤ 15 unidades, fixo no código)
Está espalhado nos componentes visuais (`isLowStock = product.stock > 0 && product.stock <= 15`), em `CentralDashboardView.tsx`, `StallOperatorView.tsx`, `CustomerTicketView.tsx` e `SalesValidatorView.tsx`. Se quiser tornar isso configurável por produto, o caminho mais limpo é adicionar um campo `lowStockThreshold` no `Product` (backend e `types.ts`) e usar esse valor em vez do `15` fixo em cada componente.

### Trocar as senhas de demonstração
Edite `plainPasswords` em `backend/src/seedData.js` e apague `data.json` pra forçar recriar os usuários com as novas senhas (ou, mais seguro, crie uma rota de troca de senha em vez de editar o seed).

### Mudar quantidade adicionada por reabastecimento (hoje fixo em +15)
Está em `frontend/src/components/StallOperatorView.tsx`, função `handleProductionClick`: `onAddProduction(productId, 15)`.

---

## 10. Como testar rapidamente as regras de negócio sem abrir o navegador

Com o backend rodando (`npm start` dentro de `backend/`), dá pra testar tudo com `curl`:

```bash
# Login
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# copie o "token" da resposta

# Vender (troque SEU_TOKEN)
curl -s -X POST http://localhost:4000/api/tickets \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"pastel_carne","quantity":2}]}'
```

Isso ajuda a confirmar que uma regra de negócio está funcionando antes mesmo de mexer na interface.
