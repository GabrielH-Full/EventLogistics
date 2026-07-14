# EventLogistics — Controle de estoque e tickets do festival

Sistema com duas contas separadas que se comunicam em tempo real:

- **Conta ADM (Caixa Central)** — vende tickets (`CustomerTicketView`) e acompanha o painel geral de todas as barracas (`CentralDashboardView`).
- **Conta da Barraca** — gerencia produção/estoque (`StallOperatorView`) e valida tickets na retirada (`SalesValidatorView`), vendo apenas os próprios produtos e tickets.

As duas contas conversam através de um backend central (`/backend`): toda venda, reposição ou validação passa por ali, é validada com as regras de negócio corretas, e propagada em tempo real via WebSocket para quem estiver com a tela aberta — caixa e barraca nunca ficam dessincronizados.

## Estrutura do projeto

```
eventlogistics/
├── backend/     API REST + WebSocket (Node.js/Express/Socket.IO) — fonte única de verdade
└── frontend/    Interface web (React/Vite) — telas de ADM e de Barraca
```

## Como rodar localmente

Abra dois terminais.

**Terminal 1 — backend**
```bash
cd backend
cp .env.example .env
npm install
npm start
```
Sobe em `http://localhost:4000`.

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
```
Sobe em `http://localhost:3000` (ou porta configurada), com proxy automático de `/api` e `/socket.io` para o backend.

## Contas de demonstração

| Usuário | Senha | Papel | Acesso |
|---|---|---|---|
| `admin` | `admin123` | ADM | Vender tickets + painel geral |
| `pastel` | `pastel123` | Barraca | Barraca do Pastel |
| `churrasco` | `churrasco123` | Barraca | Barraca do Churrasco |
| `doces` | `doces123` | Barraca | Barraca de Doces |

⚠️ São senhas de demonstração — troque-as (ou implemente cadastro de usuários) antes de usar em um evento real. Veja `backend/src/seedData.js`.

## Regras de negócio implementadas no backend

Isso é o que resolve o problema original (caixa vendendo ticket de comida que já acabou):

1. **Baixa automática de estoque a cada venda** — o backend decrementa o estoque no exato momento da venda, sem depender de aviso manual da barraca.
2. **Bloqueio automático de venda com estoque insuficiente** — a API recusa a venda (`409`) se não houver unidades suficientes, mesmo que o caixa tente vender.
3. **Permissões por papel** — só a conta ADM vende tickets; só a barraca dona de um produto pode reabastecê-lo; só a barraca dona de um ticket (ou o ADM) pode validá-lo.
4. **Tempo real** — qualquer mudança (venda, reposição, validação) é transmitida via WebSocket para todas as telas conectadas na hora.
5. **Persistência** — o estado fica salvo em `backend/data.json`, sobrevive a reinícios do servidor.

## Limitações conhecidas / próximos passos

- Um ticket pode conter itens de mais de uma barraca; hoje a validação marca o ticket inteiro como retirado. Para separar por item por barraca, seria necessário status por item (ver seção 3 do backlog de funcionalidades).
- Não há modo offline — se a internet do evento cair, o sistema para de vender até reconectar.
- Sem tela de cadastro de novos usuários/barracas pela interface; hoje isso é feito editando `backend/src/seedData.js`.
