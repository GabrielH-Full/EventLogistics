# Resumo de Tarefas de Implementacao — Migracao Completa para PostgreSQL

## Visao Geral

Eliminar o estado em memória (`state: AppState`) e o arquivo `data.json` do backend do EventLogistics, tornando o PostgreSQL a única fonte da verdade. Inclui a criação da tabela `audit_logs` para rastreabilidade e adaptação do WebSocket para buscar dados diretamente do banco.

## Fases de Implementacao

### Fase 1 — Fundação (Tarefas 1.0 e 2.0)
Criar a migration `003_audit_logs.sql` e o helper `audit.ts`. São os dois componentes sem dependências entre si e sem dependência de refatoração — podem ser feitos imediatamente.

### Fase 2 — Núcleo (Tarefas 3.0 e 4.0)
Reescrever `db.ts` (removendo estado em memória e adicionando `fetchPublicState()`) e adaptar `socket.ts` para `broadcastState()` assíncrono. A Tarefa 4.0 depende da 3.0.

### Fase 3 — Rotas (Tarefas 5.0, 6.0, 7.0 e 8.0)
Refatorar as rotas que ainda dependem do estado em memória. Após `db.ts` estar pronto, as tarefas 5.0, 6.0 e 7.0 podem ser feitas em paralelo. A 8.0 (limpeza das rotas admin) não bloqueia nada.

### Fase 4 — Verificação e Encerramento (Tarefas 9.0 e 10.0)
Testes de integração end-to-end e remoção dos arquivos órfãos (`seedData.ts`, `data.json`).

## Tarefas

- [ ] 1.0 Criar Migration `003_audit_logs.sql`
- [ ] 2.0 Criar Helper de Auditoria `audit.ts`
- [ ] 3.0 Reescrever `db.ts` — Remover Estado em Memória
- [ ] 4.0 Adaptar `socket.ts` — `broadcastState()` Assíncrono
- [ ] 5.0 Refatorar `stateRoutes.ts` — GET /api/state via Banco
- [ ] 6.0 Refatorar `productRoutes.ts` — Estoque via Banco
- [ ] 7.0 Refatorar `ticketRoutes.ts` — Tickets com Transações
- [ ] 8.0 Limpar Rotas Admin — Remover `syncStateProducts()` e `save()` Residuais
- [ ] 9.0 Testes de Integração End-to-End
- [ ] 10.0 Remover Arquivos Orfaos

## Analise de Paralelizacao

### Lanes de Execucao Paralela

| Lane   | Tarefas            | Descricao                                                        |
|--------|--------------------|------------------------------------------------------------------|
| Lane A | 1.0 → 9.0          | Migration de banco, independente de código TypeScript            |
| Lane B | 2.0 → pode ser paralela a 1.0 | Helper audit.ts, sem dependência de db.ts ainda    |
| Lane C | 3.0 → 4.0 → [5.0, 6.0, 7.0 em paralelo] → 8.0 → 10.0 | Caminho crítico principal |

### Caminho Critico

```
1.0 (migration) ──┐
                  ├──► 3.0 (db.ts) ──► 4.0 (socket) ──► 7.0 (ticketRoutes) ──► 9.0 (testes) ──► 10.0
2.0 (audit.ts) ──┘                 └──► 5.0 (stateRoutes) ─┘
                                   └──► 6.0 (productRoutes)─┘
                                   └──► 8.0 (admin cleanup) ─┘
```

### Diagrama de Dependencias

```
1.0 ──────────────────────────────────────────────────────► 9.0
2.0 ────────────────────────┐                              ▲
                            ▼                              │
3.0 ──► 4.0                 7.0 ──────────────────────────┤
     └──► 5.0 ──────────────────────────────────────────► 9.0
     └──► 6.0 ──────────────────────────────────────────► 9.0
     └──► 8.0 ──────────────────────────────────────────► 9.0
                                                           │
                                                           ▼
                                                          10.0
```
