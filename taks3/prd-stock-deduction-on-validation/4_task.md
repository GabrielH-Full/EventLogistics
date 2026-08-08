---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>frontend/stall/ui</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>None</dependencies>
<unblocks>5.0</unblocks>
</task_context>

# Tarefa 4.0: Frontend UI Components

## Visão Geral
Construir a interface principal do operador baseada no Figma, desenvolvendo componentes como Grid de Produtos, Botão Flutuante e Painel Inferior.

## Requisitos
- Componentização orientada ao reuso (conforme `prd-frontend.md`).
- Fidelidade visual ao design token fornecido (Cores, Tipografia).
- Componentes altamente responsivos ao clique para otimizar velocidade na barraca.

## Subtarefas
- [ ] 4.1 Criar o `ProductSelector` com os *badges* numéricos azuis sobrepostos.
- [ ] 4.2 Criar o painel inferior duplo: `InventoryMonitor` e `RecentTicketsFeed`.
- [ ] 4.3 Adicionar a ação visual "Desfazer / Estornar" no feed de últimos tickets.
- [ ] 4.4 Criar o botão flutuante principal `FloatingValidationButton` com formatação dinâmica de texto (ex: "Validar X Tickets").

## Sequenciamento
- Bloqueado por: 2.0 (espera APIs prontas, mas mockável).
- Desbloqueia: 5.0
- Paralelizável: Sim (pode rodar em paralelo com a Tarefa 3.0).

## Detalhes de Implementação
Siga fielmente os Design Tokens listados no PRD Frontend (Azul #0050CB, Verde #006E2F, Vermelho Baixo Estoque #FFDAD6). Utilize `React.memo` no `ProductSelector` para evitar gargalos de renderização conforme especificado na Tech Spec.

## Critérios de Sucesso
- UI idêntica ao protótipo, escalável para a resolução projetada de um tablet/monitor de balcão.
- Botão "Validar" fica perfeitamente desabilitado quando a quantidade é 0.
