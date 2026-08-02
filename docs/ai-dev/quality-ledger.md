## 2026-08-02 | PRD: tasks1/prd-crud-web | Tasks: 1.0 a 6.0 (Validação Completa)

Modelo utilizado: Claude Sonnet 4.6 (Thinking)

### Problemas Identificados

1. Categoria Técnica: Erro de integração
   Severidade: Alta
   Fase Detectada: Revisão Técnica
   Origem Provável: Lacuna na TechSpec (rota de auth legada não integrada ao PostgreSQL)
   Necessitou Reimplementação Significativa? Não — é uma task nova (7.0)
   Descrição: `POST /api/auth/login` busca usuários em memória (seedData), não no PostgreSQL. Usuários criados via CRUD admin não conseguem fazer login no sistema operacional.

2. Categoria Técnica: Falha de validação (acessibilidade)
   Severidade: Baixa
   Fase Detectada: Revisão Técnica
   Origem Provável: Ambiguidade no PRD (checklist de a11y não detalhou htmlFor)
   Necessitou Reimplementação Significativa? Não — ajuste simples de atributos
   Descrição: Labels em UserFormPage.tsx sem `htmlFor` explicitamente vinculado ao `id` dos inputs.

### Resumo da Tarefa

Total de Problemas: 2
Categoria Técnica mais frequente: Erro de integração
Origem mais frequente: Lacuna na TechSpec
Indício de fragilidade estrutural? Sim — auth legada em memória precisa de migração urgente
Sugestão de melhoria no:

- PRD: Incluir explicitamente o requisito de que toda autenticação deve usar o banco de dados PostgreSQL
- TechSpec: Adicionar seção 4.0 cobrindo migração da rota de auth legada
- Template de Task: Incluir critério de sucesso verificando que usuários criados via CRUD conseguem fazer login
- Skill: Adicionar verificação de consistência entre auth em memória vs banco
