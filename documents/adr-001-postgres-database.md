# ADR #001 – Migração da Persistência para PostgreSQL em Container Docker

| Campo | Valor |
| --- | --- |
| **Data** | 2026-07-30 |
| **Status** | *Aceito* |
| **Decisores** | Time de Arquitetura EventLogistics |
| **Seção Wiki** | `01 - Persistência & Banco de Dados` |

---

#### Histórico deste ADR

| Data | Alteração | Autor | Revisor/Contribuidor | Observações |
| --- | --- | --- | --- | --- |
| 2026-07-30 | Criação e Aceite Inicial | AI Flow Implementer | Gabriel Henrique | Decisão formal de migração da persistência local |

### 1. Contexto

No estado inicial do **EventLogistics**, todo o armazenamento do sistema (produtos, estoque, barracas, tickets e usuários) era mantido em memória e persistido em um arquivo JSON monolítico (`backend/data.json`).

Embora o arquivo JSON atendesse a demonstrações locais em um único servidor, a solução apresentava gargalos críticos para um ambiente de produção real:
- **Concorrência e Locks:** Riscos de inconsistência de escrita durante vendas simultâneas em múltiplos caixas.
- **Escalabilidade:** Incompatibilidade com múltiplas instâncias da API backend em paralelo.
- **Precisão Financeira:** Risco de imprecisão no cálculo de totais e preços usando valores de ponto flutuante em JavaScript sem validação de banco.
- **Integridade de Dados:** Ausência de restrições relacionais nativas (`FOREIGN KEY`, `CHECK constraints`, `NOT NULL`).

### 2. Decisão

Decidiu-se adotar o **PostgreSQL 16 (containerizado via Docker Compose)** como banco de dados relacional oficial do backend do EventLogistics, substituindo a persistência em arquivo `data.json`.

Principais escolhas técnicas:
1. **Containerização:** Orquestração via `docker-compose.yml` usando a imagem `postgres:16-alpine` com volume persistente `postgres_data` e *healthcheck* automático.
2. **Tipagem Numérica e Monetária:** Uso estrito do tipo `NUMERIC(10,2)` para todos os preços e totais de tickets (proibido o uso de `FLOAT`/`REAL` conforme `postgres-template.md`).
3. **Data e Hora:** Uso do tipo `TIMESTAMPTZ` para carimbos de tempo de transações e criação de tickets.
4. **Desempenho de JOINs:** Criação manual de índices B-Tree em todas as colunas de Foreign Keys (`idx_products_stall_id`, `idx_ticket_items_ticket_id`, `idx_ticket_items_product_id`).
5. **Cliente Backend:** Utilização do driver nativo `pg` com pool de conexões (`Pool`) para interações assíncronas.

### 3. Justificativa

1. **Garantia de Integridade Financeira:** O tipo `NUMERIC(10,2)` evita erros de arredondamento inerentes ao padrão IEEE 754 em JavaScript.
2. **Isolamento de Ambiente:** O Docker garante que todos os desenvolvedores e ambientes de homologação/produção executem exatamente a mesma versão do banco sem instalações manuais.
3. **Alto Desempenho e Concorrência:** O modelo transacional MVCC do PostgreSQL suporta consultas e baixas de estoque concorrentes sem travar o sistema inteiro.
4. **Baixo Impacto no Frontend:** A camada de abstração em `backend/src/db.ts` isolou a mudança, mantendo todos os contratos de API REST e eventos WebSocket (`state:update`) transparentes para a interface React.

### 4. Consequências

- **Positivos:**
  - Garantia de ACID e integridade referencial com `FOREIGN KEY` e `ON DELETE CASCADE`.
  - Suporte a transações com `BEGIN`, `COMMIT` e `ROLLBACK` durante vendas no caixa.
  - Implantação rápida e consistente usando `docker-compose up -d`.
  - Facilidade de execução de relatórios analíticos SQL sobre o histórico de vendas.
- **Negativos:**
  - Dependência do daemon do Docker ativo no ambiente de desenvolvimento local.
  - Adição de pequenas dependências npm (`pg` e `@types/pg`) no backend.

### 5. Alternativas Consideradas

| # | Alternativa | Prós | Contras | Motivo de rejeição |
| --- | --- | --- | --- | --- |
| 1 | Manter `data.json` (LowDB) | Zero dependências externas; simples para desenvolvimento | Incompatível com concorrência; sem ACID; risco de corrupção de arquivo | Impossível garantir consistência em produção |
| 2 | SQLite (embarcado) | Sem necessidade de Docker; arquivo único | Bloqueio de escrita em arquivo inteiro; suporte limitado a concorrência alta | Dificulta escalabilidade horizontal futura do servidor |
| 3 | MongoDB / NoSQL | Esquema flexível | Falta de JOINs nativos eficientes e restrições relacionais estritas entre barracas e produtos | O domínio do EventLogistics é fortemente relacional |
