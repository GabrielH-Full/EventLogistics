# Resumo de Tarefas de Migração do Banco de Dados para PostgreSQL (Docker)

## Visao Geral

Este plano de tarefas orienta a substituição da camada de persistência baseada em arquivo JSON (`data.json`) pelo banco de dados relacional **PostgreSQL containerizado via Docker**, seguindo as diretrizes e boas práticas do `postgres-template.md`.

## Fases de Implementacao

### Fase 1 - Infraestrutura em Docker e Esquema Relacional
Configuração do contêiner PostgreSQL via Docker Compose (`docker-compose.yml`), criação do esquema relacional (DDL), tipos, índices e scripts de inicialização.

### Fase 2 - Adaptação da Camada de Persistência Backend
Substituição das rotinas síncronas de `db.ts` por consultas assíncronas no PostgreSQL containerizado via cliente `pg`.

## Tarefas

- [x] 1.0 Configuração Docker & Esquema PostgreSQL do EventLogistics (`1_task.md`)
- [ ] 2.0 Implementação da Camada de Banco de Dados Assíncrona no Backend (`2_task.md`)

## Analise de Paralelizacao

### Lanes de Execucao Paralela

| Lane | Tarefas | Descricao |
|------|---------|-----------|
| Lane A (Database & Infra) | 1.0 | Subir PostgreSQL via Docker Compose, modelagem física e DDL |
| Lane B (Backend Integration) | 2.0 | Conexão do pool `pg` apontando pro container Docker e adaptação do `db.ts` |

### Caminho Critico

Tarefa 1.0 (Docker + DDL PostgreSQL) ➔ Tarefa 2.0 (Adaptação db.ts no Node.js)

### Diagrama de Dependencias

```
┌────────────────────────────────────────┐
│ 1.0 Docker & DDL PostgreSQL            │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ 2.0 Adaptação db.ts (Node + Express)   │
└────────────────────────────────────────┘
```
