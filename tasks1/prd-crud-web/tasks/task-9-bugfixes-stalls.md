---
status: pending
parallelizable: false
blocked_by: ["8.0"]
---

<task_context>
<domain>frontend/forms, backend/api</domain>
<type>bugfix_and_refactor</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, http_server</dependencies>
<unblocks>10.0</unblocks>
</task_context>

# Tarefa 9.0: Correções e Refatorações de Barracas (Fase 2)

## Visão Geral
Com base na especificação técnica de correções (`techspec-bugs.md`), esta tarefa trata de aplicar modificações no frontend para criação e edição de barracas, além de consertar os filtros do backend.

## Objetivos e Escopo

### 1. Backend (`adminStallRoutes.ts`)
- **B2.1 - Filtro de status incorreto:** Adequar a filtragem de query params (`status=true` vs `status=false`) na rota `GET /api/stalls`.

### 2. Frontend (`StallFormPage.tsx`)
- **R2.1 - Ocultar ícone na criação:** Condicionar a renderização do campo "Ícone" (seja via visualização direta ou de seleção) apenas para o modo de edição.
- **R2.2 - Remover "Operadores Vinculados":** Remover da criação de barracas a seleção de operadores, visto que esta vinculação ocorre apenas pela página de usuários.
- **F2.1 - Campo Tipo como botões:** Alterar o input de "Tipo" atual para renderizar de forma selecionável por botões (ex: "Alimento", "Bebida").
- **F2.2 - Categoria dependente:** Caso a regra de negócio se aplique a campos extra da tabela `stalls` (ou a string de `type` possuir subníveis semânticos para o UI), adicionar um seletor em grade de botões (ex: Pastel, Suco, etc.). *Nota de Implementação: O modelo DB de `stalls` possui apenas `type` genérico, então adapte para escrever a junção semântica correta dentro desse mesmo campo texto caso necessário.*

## Restrições
- Mantenha a mesma classe visual Tailwind do projeto nos novos seletores de tipo e botões.
