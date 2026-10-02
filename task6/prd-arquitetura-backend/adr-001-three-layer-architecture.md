# ADR-001 — Adoção de Arquitetura em 3 Camadas

| Campo | Valor |
|---|---|
| **Data** | 2026-08-16 |
| **Status** | Aceito |
| **Decisores** | Equipe de Engenharia EventLogistics |

---

### 1. Contexto
O backend Express original acumulava tratamento HTTP, lógica de negócio e queries SQL dentro dos handlers de rotas. Isso impedia testes unitários sem banco de dados, causava duplicação de regras de permissão e dificultava a manutenção e evolução do sistema.

### 2. Decisão
Adotar uma arquitetura explícita em 3 camadas:
1. **Routes:** Validação de formato HTTP e mapeamento de respostas/erros.
2. **Services:** Orquestração de regras de negócio, casos de uso e transações.
3. **Repositories:** Encapsulamento de persistência e comandos SQL diretos.

### 3. Justificativa
- Separação clara de responsabilidades com curva de aprendizado baixa.
- Viabiliza testes unitários rápidos e determinísticos com mocks.
- Mantém o stack simples sem introduzir a complexidade de uma arquitetura hexagonal completa no estágio atual.

### 4. Consequências
- **Positivas:** Alta testabilidade, facilidade de onboarding, eliminação de duplicações de lógica.
- **Negativas:** Maior número de arquivos e necessidade de injeção de dependências organizada.\n