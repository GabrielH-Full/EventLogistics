# PRD — Migração Completa para PostgreSQL como Fonte Única da Verdade

## Visão Geral

Atualmente, o backend do **EventLogistics** mantém dois mecanismos paralelos de persistência:
1. **Estado em memória** (`state: AppState`) + **arquivo `data.json`** — carregado na inicialização do servidor e regravado a cada mutação.
2. **PostgreSQL** — onde as rotas mais recentes (adminProductRoutes, adminStallRoutes) já fazem consultas e escritas diretamente.

Essa duplicidade gera inconsistências, bloqueia escalabilidade horizontal e impede rastreabilidade de mudanças.

Este PRD define os requisitos para **eliminar completamente o estado em memória e o `data.json` como mecanismo de persistência**, tornando o PostgreSQL a **única fonte da verdade** de todos os dados da aplicação. As alterações passam a ser rastreáveis via uma nova tabela **`audit_logs`** no próprio banco.

---

## Objetivos

- **Eliminar a duplicação de dados** entre `state` em memória, `data.json` e PostgreSQL.
- **Garantir consistência transacional** (ACID) para todas as operações: venda de tickets, validação, atualização de estoque, CRUD de produtos/barracas.
- **Habilitar escalabilidade horizontal** — múltiplas instâncias do backend apontando para o mesmo banco sem estado local divergente.
- **Introduzir rastreabilidade de alterações** via tabela `audit_logs` no PostgreSQL, substituindo qualquer log em arquivo.
- **Manter a experiência em tempo real** via WebSocket sem depender de estado em memória.

**Métricas de sucesso:**
- Zero referências a `state`, `save()`, `load()` ou `data.json` em qualquer arquivo `*.ts` após a migração.
- Todas as rotas respondem exclusivamente com dados lidos do PostgreSQL.
- Tabela `audit_logs` registra 100% das mutações (criação, atualização, exclusão de produtos, barracas, tickets, usuários).
- Tempo de resposta das rotas mantido ≤ 200ms para operações simples (p95).

---

## Histórias de Usuário

**US-01 — Administrador (Caixa Central)**
Como administrador, quero que ao vender um ticket o estoque seja decrementado atomicamente no banco de dados, para que nunca haja venda de produto sem estoque mesmo sob concorrência.

**US-02 — Operador de Barraca**
Como operador de barraca, quero que ao validar um ticket o status seja atualizado diretamente no banco, para que qualquer outro operador ou o caixa central veja o status correto instantaneamente via WebSocket.

**US-03 — Administrador (Auditoria)**
Como administrador, quero consultar o histórico de todas as alterações realizadas (quem alterou, o quê e quando), para ter rastreabilidade completa das operações do evento.

**US-04 — Desenvolvedor / DevOps**
Como desenvolvedor, quero poder escalar horizontalmente o backend sem me preocupar com estado local por instância, para que o sistema suporte mais usuários sem inconsistência de dados.

**US-05 — Sistema (Inicialização)**
Como sistema, quero que ao iniciar o servidor ele consulte o banco para montar o estado atual, sem precisar de um arquivo local intermediário (`data.json`).

---

## Funcionalidades Principais

### F-01 — Remoção do Estado em Memória e `data.json`

Eliminar de `db.ts` as funções `load()`, `persist()`, `save()`, a variável exportada `state` e toda referência ao arquivo `data.json`.

**Requisitos funcionais:**
1. O arquivo `db.ts` deve exportar apenas `db` (instância do `Pool` do Postgres).
2. A função `publicState()` deve ser substituída por uma consulta assíncrona ao banco.
3. Todas as rotas que importam `{ state, save }` de `../db` devem ser refatoradas para usar `db.query()`.
4. O arquivo `data.json` não deve mais ser gerado pelo backend.
5. O arquivo `seedData.ts` deve ter seu equivalente em SQL (`seed.sql`) para inicialização do banco.

---

### F-02 — Refatoração das Rotas para PostgreSQL Puro

Todas as rotas que ainda usam `state` em memória devem ser reescritas para consultar e escrever exclusivamente via `db.query()`.

**Rotas afetadas:**
- `ticketRoutes.ts` — criação e validação de tickets (hoje usa `state.tickets`, `state.products`).
- `productRoutes.ts` — atualização de estoque (produção na barraca).
- `stateRoutes.ts` — snapshot inicial (`GET /api/state`).

**Requisitos funcionais:**
1. `POST /api/tickets` deve verificar estoque via `SELECT ... FOR UPDATE` (lock de linha) para evitar race conditions.
2. `POST /api/tickets/:id/validate` deve atualizar `status` diretamente na tabela `tickets`.
3. `GET /api/state` deve retornar dados frescos do banco, sem cache em memória.
4. Toda operação de mutação deve ser encapsulada em uma transação (`BEGIN / COMMIT / ROLLBACK`).

---

### F-03 — Tabela `audit_logs` e Registro de Auditoria

Criar a tabela `audit_logs` no PostgreSQL e registrar automaticamente todas as mutações relevantes do sistema.

**Schema da tabela:**
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT      REFERENCES users(user_id),
  action      VARCHAR(60) NOT NULL,      -- ex: TICKET_CREATED, PRODUCT_UPDATED
  entity_type VARCHAR(50) NOT NULL,      -- ex: tickets, products, stalls
  entity_id   TEXT        NOT NULL,
  changes     JSONB,                     -- { before: {...}, after: {...} }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity    ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user      ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created   ON audit_logs (created_at DESC);
```

**Requisitos funcionais:**
1. Toda rota de mutação (POST, PUT, PATCH, DELETE) deve inserir um registro em `audit_logs` após o commit da operação principal.
2. O campo `user_id` deve ser extraído do JWT do usuário autenticado (`req.user`).
3. O campo `changes` deve conter o estado anterior (`before`) e o novo estado (`after`) do registro alterado em formato JSONB.
4. A inserção em `audit_logs` não deve bloquear a resposta ao cliente.
5. A falha ao inserir em `audit_logs` **não** deve reverter a operação principal (auditoria é best-effort).

---

### F-04 — WebSocket `broadcastState()` sem Estado em Memória

Adaptar o `socket.ts` e o `broadcastState()` para buscar dados do Postgres ao invés de `publicState()` que lê do `state` em memória.

**Requisitos funcionais:**
1. `broadcastState()` deve tornar-se assíncrona e executar queries ao banco antes de emitir o evento `state:update`.
2. Ao conectar um novo cliente via WebSocket, o servidor deve emitir o estado atual buscado do banco.
3. O evento `state:update` deve incluir os mesmos campos atuais: `{ products, stalls, tickets }`.

---

## Experiência do Usuário

Esta é uma mudança **infraestrutural e transparente** para o usuário final. Nenhuma tela ou fluxo de UI será alterado. Os benefícios perceptíveis ao usuário são:

- **Consistência garantida:** Nunca verá estoque desatualizado ao recarregar o app.
- **Disponibilidade:** O sistema continua funcional mesmo após reinício do backend, sem perda de dados.
- **Velocidade de resposta WebSocket:** Mantida ou melhorada por eliminar a leitura/escrita em disco.

O administrador com acesso à auditoria terá uma nova fonte de dados para consultar o histórico de operações diretamente no banco.

---

## Restrições Técnicas de Alto Nível

- O banco PostgreSQL já está em uso (via `docker-compose.yml`) e as tabelas principais já existem com schema definido.
- A refatoração deve ser **não-breaking** para o frontend — os contratos de API (endpoints, payloads de resposta) devem permanecer os mesmos.
- O sistema usa **Socket.IO** para WebSocket; a nova versão de `broadcastState()` deve ser compatível com a biblioteca existente.
- A tabela `audit_logs` deve ser adicionada via nova migration SQL (`003_audit_logs.sql`) para manter o versionamento do schema.
- O campo `entity_id` é `TEXT` para suportar IDs de diferentes tabelas com tipos variados (`TEXT`, `BIGINT`, `UUID`).
- Não há ORM em uso — todas as queries continuam via `pg.Pool` com SQL puro.

---

## Não-Objetivos (Fora de Escopo)

- **Interface de visualização de audit_logs no frontend** — feature futura.
- **Endpoint de API para consulta de audit_logs** — fora do escopo desta iteração.
- **Cache em memória com Redis** — pode ser considerado no futuro para otimização de `broadcastState()`.
- **Migração de dados históricos do `data.json` para o banco** — dados existentes em desenvolvimento não precisam ser migrados.
- **Mudanças no schema das tabelas existentes** (`products`, `stalls`, `tickets`, `users`) — apenas a nova tabela `audit_logs` é adicionada.
- **Autenticação ou autorização para leitura de audit_logs** — fora do escopo desta entrega.

---

## Questões em Aberto

1. **`ticketRoutes.ts` usa `state.products` para verificar `stallId` na validação** — a tabela `ticket_items` no banco já guarda o `stall_id` ou é necessário JOIN em `products`? Resposta: é necessário um JOIN em products para obter o stall_id, e a query acima é o caminho correto.
2. **Tabela `tickets` e `ticket_items` já existem no banco?** — confirmar se `001_init_schema.sql` as cria com campos `status` e `validated_at`. Resposta: As tabelas tickets e ticket_items foram criadas com os campos status e validated_at em 001_init_schema.sql
3. **`broadcastState()` assíncrona e concorrência** — avaliar se um debounce ou queue é necessário para evitar queries duplicadas em eventos simultâneos. Resposta:  Debounce/queue não é necessário para o escopo atual. A implementação direta de broadcastState() assíncrona sem controle adicional é suficiente e adequada para o volume de um evento presencial.
4. **Falha de conexão ao banco no `broadcastState()`** — definir comportamento: silenciar o erro, logar, ou retentar com backoff? Resposta: Questão 4 fechada: Comportamento definido: logar o erro com console.error + silenciar (não propagar, não fazer retry). A recuperação dos clientes é delegada ao mecanismo nativo de reconexão do Socket.IO e ao endpoint GET /api/state.
5. **Convenção de `action` no `audit_logs`** — alinhar o padrão de nomenclatura antes de implementar (ex: `TICKET_CREATED` vs `ticket.created`). Resposta: A convenção de `action` no `audit_logs` será TICKET_CREATED, TICKET_VALIDATED, PRODUCT_CREATED, PRODUCT_UPDATED, PRODUCT_DELETED, PRODUCT_STOCK_UPDATED, USER_CREATED, USER_UPDATED, USER_DELETED, STALL_CREATED, STALL_UPDATED, STALL_DELETED, STALL_STOCK_RESET.
