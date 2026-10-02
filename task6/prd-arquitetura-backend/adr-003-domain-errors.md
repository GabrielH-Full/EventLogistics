# ADR-003 — Erros de Domínio Tipados

| Campo | Valor |
|---|---|
| **Data** | 2026-08-16 |
| **Status** | Aceito |
| **Decisores** | Equipe de Engenharia EventLogistics |

---

### 1. Contexto
Anteriormente, as rotas verificavam mensagens de erro em texto ou lançavam erros genéricos HTTP diretamente, misturando conceitos do protocolo web com a lógica da aplicação.

### 2. Decisão
Criar classes de erro especializadas em `src/errors/DomainErrors.ts` (`InsufficientStockError`, `NotFoundError`, `ForbiddenError`, `ConflictError`). Os Services lançam esses erros de domínio e as Rotas realizam `catch` tipado via `instanceof`, mapeando-os para os respectivos status HTTP (409, 404, 403, 400).

### 3. Justificativa
- Desacopla as regras de negócio de protocolos HTTP.
- Evita parsing frágil de strings de mensagens para tomada de decisões.

### 4. Consequências
- **Positivas:** Código limpo, manutenível e com tipagem estrita no tratamento de exceções.
- **Negativas:** Necessidade de manter as classes de erro alinhadas com os cenários de negócio.\n