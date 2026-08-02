# ADR 002: Implementação do CRUD Web Administrativo e Resolução de Conflitos de Acesso

**Status:** Aceito
**Data:** 2026-08-02
**Contexto de Tarefa:** tasks1/prd-crud-web

## Contexto
O sistema EventLogistics necessitava de uma interface para que usuários com papel de administrador pudessem gerenciar (criar, ler, atualizar e desativar) as entidades base do sistema (Usuários, Barracas e Produtos), que anteriormente dependiam da modificação manual do arquivo `seedData.js`. 
Com a migração para PostgreSQL (estabelecida no ADR-001), essa interface precisava gerenciar adequadamente a consistência de dados relacionais e tratar as complexidades de múltiplos perfis de acesso ("admin", "stall" e "operator"), preservando a usabilidade e segurança.

## Decisões

### 1. Migração Total para CRUD e Substituição do seedData.js
**Decisão:** Substituímos o gerenciamento manual do `seedData.js` por interfaces React dedicadas sob a rota `/admin`.
**Motivação:** A manipulação manual do código impedia o uso do sistema por administradores de negócio sem conhecimento de programação e aumentava a possibilidade de corrupção do estado em memória.

### 2. Separação Estrita de Rotas entre Operadores e Admins
**Decisão:** Estabeleceu-se o roteador `adminProductRoutes.ts` (exclusivo para Admins) em coexistência ao roteador `productRoutes.ts` (híbrido/operadores). O `server.ts` foi configurado para resolver a rota mais específica do operador (ex: `POST /api/products/:id/production`) ANTES de ceder controle ao roteador global de Admin (`/api/products`).
**Motivação:** Como os operadores (stall/operator) necessitam modificar parcialmente o estoque de um produto sem ter acesso às funções de CRUD, manter a rota em roteadores separados com ordens de precedência explícitas no Express resolve colisões do middleware de segurança (`requireAdmin`).

### 3. Vínculo N:M via `stall_users` e Injeção Dinâmica no JWT
**Decisão:** A relação entre Operadores e Barracas ocorre unicamente pela tabela associativa `stall_users`. Durante o login (`POST /api/auth/login`), se o usuário não possuir um `stallId` direto, o sistema resolve a associação e injeta dinamicamente no token JWT da sessão.
**Motivação:** Reduz a complexidade da interface de Barracas (que não precisa mais lidar com arrays de usuários na edição) e transfere a responsabilidade para o momento exato em que a permissão importa (na autenticação), impedindo bugs de falta de acesso operacional no painel da barraca.

### 4. Categorização Híbrida de Produtos (`parent_type`)
**Decisão:** A filtragem de produtos consolidou-se em utilizar chaves físicas (`category_id`) e chaves lógicas virtuais (`parent_type`: 'food' ou 'drink') via `LEFT JOIN` do SQL.
**Motivação:** Permite flexibilidade à interface Frontend criar abas macro de negócio (Alimentos / Bebidas) sem sacrificar a modelagem rigorosa das subcategorias gerenciadas no banco de dados.

## Consequências
- **Positivas:** A aplicação atinge um nível maduro de "Produto de Software", permitindo que toda a operação do evento seja gerenciada pela web sem necessidade de reinicializar o backend ou editar código-fonte. O JWT dinâmico torna a infraestrutura autossuficiente para mudanças operacionais.
- **Negativas / Riscos Assumidos:** O acoplamento de ordenação de rotas no `server.ts` requer cuidado de novos desenvolvedores, pois a reordenação descuidada de middlewares pode bloquear o acesso dos operadores acidentalmente (como ocorreu temporariamente durante o desenvolvimento).

## Sugestões de Melhorias (Roadmap Técnico)
Com base nas lições aprendidas durante essa migração, recomendamos as seguintes evoluções arquiteturais para o futuro do projeto:

1. **Centralização de Permissões (RBAC Robusto):** Substituir o controle de acesso atual — que baseia-se fortemente na ordem de declaração das rotas no Express — por bibliotecas maduras de controle de acesso (como o `CASL`). Isso permitirá definir matrizes de permissão ("Admin pode X", "Operador pode Y") e validar as permissões de forma declarativa dentro do endpoint, ignorando colisões de middleware.
2. **Eliminação do Estado Híbrido (JSON + Postgres):** A funcionalidade de controle de estoque (`/api/products/:id/production` e o comando de Reset) e os WebSockets ainda operam mutando uma árvore json em memória (`db.ts`/`data.json`) em paralelo ao banco de dados, atuando quase como um Cache. Idealmente, o estado operacional deve ser migrado em definitivo para transações SQL atreladas ao Redis (para pub/sub e WebSockets), removendo a sincronia híbrida e reduzindo inconsistências sistêmicas.
3. **Auditoria de Ações Críticas (Audit Trail):** Como o CRUD agora está na web nas mãos de múltiplos administradores, toda ação de exclusão, edição de permissão, e alteração de preço deve ser logada em uma nova tabela de banco (`audit_logs`) detalhando "Quem, Quando, e Qual campo foi alterado" para garantir rastreabilidade completa.
4. **Otimização de Paginação (Cursor-Based Pagination):** Atualmente as listagens e filtros utilizam `LIMIT` e `OFFSET`. À medida que a tabela de histórico de Tickets e Usuários crescer consideravelmente, o `OFFSET` se tornará lento. Migrar para paginação baseada em cursores (`WHERE id > last_seen_id`) trará ganhos drásticos de performance.
