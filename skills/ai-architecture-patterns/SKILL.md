---
name: architecture-patterns
description: Domine padrões comprovados de arquitetura backend, incluindo Clean Architecture, Arquitetura Hexagonal e
  Domain-Driven Design (DDD) para construir sistemas sustentáveis, testáveis e escaláveis.
---

## Use esta skill quando

- Estiver desenhando novos sistemas backend do zero.
- For refatorar aplicações monolíticas para melhorar a manutenibilidade.
- Precisar estabelecer padrões arquiteturais para o seu time.
- For migrar de arquiteturas rigidamente acopladas para arquiteturas fracamente acopladas (loosely coupled).
- Estiver implementando os princípios do Domain-Driven Design (DDD).
- For criar bases de código testáveis e fáceis de usar mocks.
- Estiver planejando a decomposição de microsserviços.

## Não use esta skill quando

- Precisar apenas de refatorações pequenas e locais.
- O sistema for focado primariamente no frontend, sem mudanças na arquitetura backend.
- Precisar de detalhes de implementação puramente técnicos sem design arquitetural.

## Instruções de Uso

1. **Esclareça os limites do domínio**, restrições do negócio e metas de escalabilidade.
2. **Selecione o padrão de arquitetura** que melhor se adapte à complexidade do domínio.
3. **Defina as fronteiras dos módulos**, interfaces claras e regras de inversão de dependência.
4. **Forneça passos de migração** graduais e validações arquiteturais (ex: testes com ArchUnit se aplicável).
5. **Para fluxos que devem sobreviver a falhas** (pagamentos, processamento de pedidos, fluxos multi-etapas), utilize
   *durable execution* na camada de infraestrutura — frameworks como o DBOS persistem o estado do workflow, garantindo
   recuperação pós-queda sem inflar a complexidade do design.

> Para padrões detalhados, checklists e o template de arquitetura oficial do ecossistema EventLogistics, consulte `templates/architecture-template.md`.

---

## Padrões e Conceitos Chave

### Domain-Driven Design (DDD)

* **Bounded Contexts:** Delimitação clara de fronteiras onde um modelo de domínio específico se aplica.
* **Linguagem Ubíqua:** Alinhamento estrito de nomenclatura entre especialistas de negócio e desenvolvedores.
* **Building Blocks:** Uso correto de Entidades, Value Objects, Agregados, Repositórios e Serviços de Domínio.

### Arquitetura Hexagonal (Ports & Adapters)

* **Core da Aplicação:** O domínio e a lógica de negócio ficam isolados no centro, sem dependências externas.
* **Ports (Portas):** Interfaces que definem como o mundo externo interage com a aplicação (Inbound) e como a aplicação
  interage com o exterior (Outbound).
* **Adapters (Adaptadores):** Implementações técnicas (REST Controllers, clientes de banco de dados, mensageria) que se
  conectam às portas.

### Clean Architecture

* **Regra de Dependência:** O código das camadas internas nunca deve conhecer o código das camadas externas.
* **Camadas:** Separação rígida entre Entidades, Casos de Uso (Use Cases), Conversores de Interface (Interface Adapters)
  e Infraestrutura (Frameworks & Drivers).

---

## Abordagem de Resposta para o Gemini

1. **Análise de Complexidade:** Avalie se o cenário exige DDD tático ou se uma abordagem mais simples (como um CRUD
   limpo) resolve.
2. **Desenho de Fronteiras:** Proponha a separação de pacotes/módulos baseada no isolamento do domínio.
3. **Definição de Contratos:** Escreva primeiro as interfaces (Ports) antes das implementações de infraestrutura.
4. **Resiliência e Estado:** Identifique pontos críticos que necessitam de *durable execution* ou orquestração para
   evitar estados inconsistentes.

---

## Skills Relacionadas

Funciona muito bem em conjunto com: `event-sourcing-architect`, `saga-orchestration`, `workflow-automation`, `dbos-*`