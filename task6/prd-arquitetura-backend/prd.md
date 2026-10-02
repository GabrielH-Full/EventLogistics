# PRD — Refatoração para Arquitetura em 3 Camadas
**EventLogistics · Backend Node.js / TypeScript**
**Versão:** 1.1 · **Data:** 2026-08-16 · **Status:** Proposta

---

## Visão Geral

O backend do EventLogistics é um monolito Express funcional em que as três responsabilidades fundamentais de qualquer backend — receber requisições HTTP, executar regras de negócio e persistir dados — estão misturadas dentro dos arquivos de rotas. Essa estrutura impede a escrita de testes unitários, dificulta a manutenção e força a duplicação de lógica a cada nova funcionalidade adicionada.

Este PRD propõe a reorganização do código em **3 camadas explícitas e independentes** (Routes → Services → Repositories), sem alterar nenhum comportamento externo visível: contratos de API REST, protocolo WebSocket e schema de banco de dados permanecem intactos. O valor entregue é um codebase estruturado para crescer com segurança, testável e compreensível para qualquer desenvolvedor que entre no projeto.

---

## Objetivos

- **Testabilidade:** permitir testar qualquer regra de negócio com mocks simples, sem necessidade de instância de banco real — medido pela existência de ao menos 1 suite de testes unitários cobrindo os casos críticos do `TicketService`.
- **Manutenibilidade:** cada arquivo possui uma única responsabilidade clara; um desenvolvedor novo consegue identificar onde está uma regra de negócio sem ler todas as rotas.
- **Eliminação de duplicação:** a verificação de ownership de barraca (`stall_id`) existe em um único lugar (`InventoryService`), sem cópias ligeiramente diferentes em múltiplas rotas.
- **Extensibilidade:** adicionar um novo caso de uso (ex: reembolso, multi-evento) exige criar 1 Service + 1 Repository, sem tocar nos existentes.
- **Segurança de escopo:** nenhuma rota terá acesso direto ao banco após a refatoração — SQL fica exclusivamente nos Repositories.

---

## Histórias de Usuário

**Como desenvolvedor do time,** quero que as regras de negócio (ex: validação de estoque) estejam isoladas em um Service, para que eu possa escrevê-las, lê-las e testá-las sem precisar entender o protocolo HTTP ao redor.

**Como desenvolvedor do time,** quero que todo SQL esteja em Repositories, para que eu saiba exatamente onde olhar quando precisar otimizar uma query ou corrigir um bug de persistência.

**Como tech lead,** quero que nenhuma rota importe `db` diretamente, para que eu possa garantir em code review que não há SQL ou lógica de negócio escapando para a camada HTTP.

**Como desenvolvedor novo no projeto,** quero encontrar a regra de estoque insuficiente em `TicketService.createTicket()`, para que meu onboarding seja intuitivo e baseado em conceitos de domínio, não em leitura sequencial de handlers.

**Como operador/admin,** quero que todas as funcionalidades existentes continuem funcionando exatamente como antes, para que a refatoração seja invisível para o usuário final.

---

## Funcionalidades Principais

### F1 — Camada de Repositórios (`src/repositories/`)

Criar os quatro repositórios que encapsulam todo SQL da aplicação, extraídos das rotas e de `db.ts`:

- **TicketRepository:** operações em `tickets` e `ticket_items` — criar ticket com itens, buscar por ID com lock, atualizar status, verificar ownership de barraca.
- **ProductRepository:** operações em `products` — buscar, decrementar/incrementar/zerar estoque, CRUD admin, verificar histórico de vendas.
- **StallRepository:** operações em `stalls` e `stall_users` — CRUD e sincronização N:M com usuários.
- **UserRepository:** operações em `users` e `stall_users` — CRUD, busca por username, sincronização N:M com barracas.

**RF-01:** `db.ts` deve conter apenas a instância do Pool e `fetchPublicState()` ao final desta fase. As funções `validateTicket()` e `revertTicket()` migram para `TicketRepository` e `TicketService`.

**RF-02:** Repositories não devem importar `socket.ts`, `audit.ts` ou qualquer módulo de camada superior.

### F2 — Camada de Services (`src/services/`)

Criar os Services que contêm todas as regras de negócio da aplicação:

- **TicketService:** casos de uso de tickets — criar venda (com validação de estoque e débito atômico), validar ticket (com verificação de ownership), reverter ticket (com restauração de estoque).
- **InventoryService:** casos de uso de estoque de barraca — registrar produção e resetar estoque; centraliza a verificação de ownership de `stall_id`.
- **UserService:** criar usuário com hash de senha, listar, atualizar, ativar/desativar, excluir; gerencia sincronização N:M com barracas.
- **ProductService:** CRUD admin de produtos; contém a regra que impede exclusão de produto com histórico de vendas.
- **StallService:** CRUD admin de barracas.
- **CategoryService:** CRUD de subcategorias de produtos.

**RF-03:** Services não devem importar `express`, `Request` ou `Response`.

**RF-04:** Todo método de Service que executa uma mutação de dados deve disparar `logAudit()` e `broadcastState()` (ou `broadcastToStall()`) ao final da operação bem-sucedida.

**RF-05:** Services devem receber suas dependências (repositories, auditLogger, broadcast) via constructor — sem acoplamento estático.

### F3 — Refatoração das Rotas (`src/routes/`)

Substituir o corpo de cada handler pelo padrão: validação de formato do body → chamada ao Service → mapeamento de erro de domínio para status HTTP.

**RF-06:** Nenhum arquivo em `src/routes/` deve conter SQL ou chamar `broadcastState()` diretamente ao final da refatoração.

**RF-07:** O mapeamento de erros de domínio para status HTTP deve ocorrer exclusivamente nas rotas (`InsufficientStockError` → 409, `NotFoundError` → 404, `ForbiddenError` → 403).

### F4 — Erros de Domínio Tipados (`src/errors/`)

Criar `DomainErrors.ts` com classes de erro específicas do domínio:

- `InsufficientStockError` (inclui nome do produto e quantidade disponível)
- `NotFoundError`
- `ForbiddenError`
- `ConflictError`

**RF-08:** Rotas devem usar `catch` tipado com as classes de erro de domínio — nunca inspecionar a string da mensagem de erro para determinar o status HTTP.

---

## Experiência do Usuário

Esta refatoração é **completamente invisível para o usuário final** — não há mudança de interface, comportamento ou contrato observável externamente.

O impacto é interno ao time de desenvolvimento:

- **Onboarding:** desenvolvedor novo lê `TicketService.ts` para entender o fluxo de venda, sem rastrear lógica espalhada em múltiplos handlers.
- **Debug:** ao investigar um bug de estoque, o desenvolvedor vai diretamente a `TicketService.createTicket()` e `ProductRepository.decrementStock()`.
- **Code review:** reviewer pode verificar mecanicamente se uma PR viola as fronteiras de camada (rota com SQL, service com import do express, etc.).
- **Testes:** após a Fase 5, qualquer regra de negócio pode ser testada com `new TicketService(mockRepo, ...)` — sem banco real, em milissegundos.

---

## Restrições Técnicas de Alto Nível

- **Sem mudanças de contrato externo:** nenhuma URL, método HTTP, status code, shape de resposta JSON ou evento WebSocket pode ser alterado.
- **Sem migrations de banco:** o schema PostgreSQL permanece exatamente como está — nenhuma tabela, coluna ou índice novo.
- **Sem novas dependências de produção:** a refatoração usa apenas o que já existe no projeto (`pg`, `bcryptjs`, Express). A única adição permitida é um framework de testes (`vitest` ou `jest`) em devDependencies.
- **Atomicidade preservada:** operações hoje atômicas (BEGIN/COMMIT em criação de ticket, revert e criação de usuário) devem continuar atômicas após a refatoração.
- **Execução faseada:** a refatoração deve ser executada em fases incrementais (Repositórios → Services → Rotas → Erros → Testes), com o sistema funcionando e deployável ao fim de cada fase.

---

## Não-Objetivos (Fora de Escopo)

- **Mudanças de schema de banco:** migrations, novas tabelas ou otimizações de índices estão fora de escopo.
- **Mudanças nos contratos de API:** renomear endpoints, alterar payloads ou adicionar novos endpoints são trabalhos separados.
- **Introdução de ORM:** Prisma, TypeORM ou similar não serão adotados; os Repositories usam SQL direto via `pg`.
- **Arquitetura Hexagonal completa:** ports & adapters e inversão de dependência via interfaces TypeScript para todos os repositories são evoluções futuras.
- **Cache ou otimizações de performance:** melhorias como Redis para `fetchPublicState()` são roadmap pós-refatoração.
- **Multi-evento ou multi-tenant:** suporte a múltiplos eventos simultâneos virá depois, facilitado pela arquitetura criada aqui.
- **Alterações no frontend:** zero mudanças no cliente web.
- **Container DI (Inversify, tsyringe):** injeção de dependência é feita manualmente via constructor.

---

## Questões em Aberto

1. **Framework de testes:** Vitest ou Jest? Ambos são compatíveis com o stack TypeScript — a escolha impacta apenas `devDependencies` e configuração, sem impacto arquitetural.
2. **Estratégia de instanciação dos Services:** as instâncias de Service/Repository serão criadas no startup (`server.ts`) e injetadas nas rotas via closure, ou via módulo singleton? Isso afeta o padrão de import nas rotas refatoradas.
3. **CategoryService:** `productCategoryRoutes.ts` não foi detalhado no contexto atual. Confirmar se está incluído nesta fase ou postergado.
4. **Cobertura mínima de testes:** a Fase de testes unitários é "opcional, mas recomendada". Definir se a entrega é considerada completa sem testes, ou se um subset mínimo (ex: `TicketService`) é obrigatório para aceite.
