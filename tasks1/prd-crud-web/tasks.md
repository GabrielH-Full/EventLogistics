# Resumo de Tarefas — CRUD Web: Gestão de Usuários, Barracas e Produtos

## Visão Geral

Implementação das telas de CRUD administrativo para **Usuários**, **Barracas** e **Produtos** (alimentos e bebidas) no EventLogistics. Substitui as edições manuais em `seedData.js` por uma interface web exclusiva para a conta `admin`, com backend REST e banco PostgreSQL.

**PRD:** [prd.md](./prd.md) | **TechSpec:** [techspec.md](./techspec.md)

---

## Fases de Implementação

### Fase 1 — Banco de Dados e Migrations
DDL das novas tabelas, índices e seed de dados. Pré-requisito de tudo.

### Fase 2 — Backend: Middleware e Rotas de Usuários
Middleware `requireAdmin` + CRUD completo de usuários.

### Fase 3 — Backend: Rotas de Barracas e Produtos
CRUD de barracas, relação N:M e produtos com categorias.

### Fase 4 — Frontend: Componentes Base e Roteamento
Guarda de rota `AdminGuard`, `DataTable`, `ConfirmModal` e hooks reutilizáveis.

### Fase 5 — Frontend: Módulos Usuários e Barracas
Telas de listagem e formulário para usuários e barracas, com paridade Figma.

### Fase 6 — Frontend: Módulo Produtos e Polimento Final
Telas de produtos, validação de qualidade UI e testes de integração.

---

## Tarefas

- [ ] [1.0 Database — Migrations e DDL](./tasks/task-1-database.md)
- [ ] [2.0 Backend — Middleware e CRUD de Usuários](./tasks/task-2-backend-users.md)
- [ ] [3.0 Backend — CRUD de Barracas e Produtos](./tasks/task-3-backend-stalls-products.md)
- [ ] [4.0 Frontend — Componentes Base e Roteamento](./tasks/task-4-frontend-base.md)
- [ ] [5.0 Frontend — Módulos Usuários e Barracas](./tasks/task-5-frontend-users-stalls.md)
- [ ] [6.0 Frontend — Módulo Produtos e Polimento Final](./tasks/task-6-frontend-products-polish.md)

---

## Análise de Paralelização

### Lanes de Execução Paralela

| Lane | Tarefas | Descrição |
|---|---|---|
| Lane A (sequencial) | 1.0 → 2.0 → 3.0 | Backend completo deve ser entregue em sequência |
| Lane B (após 1.0) | 4.0 em paralelo com 2.0 | Componentes base de frontend não dependem das rotas |
| Lane C (após 4.0 + 2.0 + 3.0) | 5.0 → 6.0 | Módulos de tela dependem de backend + componentes base |

### Caminho Crítico

```
1.0 (DB) → 2.0 (users API) → 3.0 (stalls+products API) → 5.0 (UI users+stalls) → 6.0 (UI products+polish)
```

### Diagrama de Dependências

```
1.0 ──────┬──────► 2.0 ──────► 3.0 ──────┐
          │                               │
          └──────► 4.0 ──────────────────►┴──► 5.0 ──► 6.0
```

---

## Riscos a Monitorar

| Risco | Tarefa | Ação |
|---|---|---|
| Tabela `products` já existe | 1.0 | Auditar banco antes do DDL |
| Campo `role` ausente no JWT | 2.0 | Verificar payload do login antes de implementar o guard |
| Conflito de rotas `/api/products` | 3.0 | Auditar backend antes de criar novas rotas |
