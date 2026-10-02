# ADR-002 — Padrão Unit of Work com PoolClient para Transações

| Campo | Valor |
|---|---|
| **Data** | 2026-08-16 |
| **Status** | Aceito |
| **Decisores** | Equipe de Engenharia EventLogistics |

---

### 1. Contexto
Operações como a criação de tickets de venda exigem atomicidade estrita: consulta de estoque com lock (`SELECT FOR UPDATE`), débito de quantidade, inserção de ticket e inserção de itens devem ocorrer na mesma transação PostgreSQL.

### 2. Decisão
Adotar o padrão Unit of Work onde a camada de **Service** obtém um `PoolClient` do pool, inicia a transação (`BEGIN`), repassa o `client` como parâmetro para os métodos dos **Repositories**, e executa `COMMIT` ou `ROLLBACK`, garantindo a liberação da conexão via bloco `finally { client.release(); }`.

### 3. Justificativa
- Permite que múltiplos repositórios participem da mesma transação de banco sem acoplamento entre si.
- Mantém o controle do ciclo de vida transacional no Service, onde reside a regra de negócio.

### 4. Consequências
- **Positivas:** Consistência atômica garantida sem a necessidade de ORMs pesados.
- **Negativas:** Exige disciplina no repasse de parâmetros e na garantia de liberação de conexões.\n