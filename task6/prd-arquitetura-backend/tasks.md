# Resumo de Tarefas de Implementação - Refatoração para Arquitetura em 3 Camadas

## Visão Geral

Planejamento detalhado de implementação para refatorar o backend do EventLogistics em uma arquitetura desacoplada de 3 camadas (Routes → Services → Repositories). O objetivo é isolar regras de negócio e consultas SQL, viabilizar testes unitários e eliminar duplicação de lógica mantendo 100% de compatibilidade retroativa com a API e o banco existente.

## Fases de Implementação

### Fase 1 — Fundação de Tipos e Erros de Domínio
Definição dos contratos estruturais, tipos TypeScript de banco e DTOs, além da hierarquia de classes de erro de domínio.

### Fase 2 — Camada de Repositórios de Persistência
Criação dos 4 repositórios SQL dedicados e limpeza do `db.ts`.

### Fase 3 — Camada de Services de Domínio
Implementação dos casos de uso, orquestração de regras de negócio, transações (Unit of Work), auditoria e broadcast.

### Fase 4 — Refatoração dos Handlers das Rotas Express
Adaptação das rotas HTTP para atuar como adaptadores finos delegando para os Services e mapeando erros tipados.

### Fase 5 — Suíte de Testes Unitários
Implementação de testes unitários isolados com mocks para os fluxos críticos de negócio.

---

## Tarefas

- [x] 1.0 Configuração de Tipos Compartilhados e Erros de Domínio
- [x] 2.0 Implementação da Camada de Repositórios e Limpeza de db.ts
- [x] 3.0 Implementação da Camada de Services (Regras de Negócio e Transações)
- [x] 4.0 Refatoração dos Handlers das Rotas HTTP Express
- [ ] 5.0 Criação da Suíte de Testes Unitários dos Services

---

## Análise de Paralelização

### Lanes de Execução Paralela

| Lane | Tarefas | Descrição |
|---|---|---|
| **Lane A (Fundação & Core Domínio)** | 1.0 → 2.0 (Ticket/Product) → 3.0 (TicketService/InventoryService) | Fluxo crítico de tickets e controle de estoque |
| **Lane B (Administração & Gestão)** | 2.0 (User/Stall) → 3.0 (UserService/StallService) | Gestão administrativa de usuários e barracas |
| **Lane C (Rotas & Integração)** | 4.0 | Adaptação dos endpoints HTTP (depende de 3.0) |
| **Lane D (Qualidade & Testes)** | 5.0 | Testes unitários dos services desenvolvidos |

### Caminho Crítico

`1.0 (Tipos & Erros)` → `2.0 (Repositories)` → `3.0 (Services)` → `4.0 (Rotas)` → `5.0 (Testes Unitários)`

### Diagrama de Dependências

```
  [1.0 Tipos & Erros]
          │
          ▼
  [2.0 Repositórios]
          │
          ▼
  [3.0 Services de Domínio]
     ┌────┴────────────┐
     ▼                 ▼
[4.0 Rotas Express] [5.0 Testes Unitários]
```\n