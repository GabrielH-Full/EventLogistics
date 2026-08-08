---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>frontend/auth</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>None</dependencies>
<unblocks>"3.0"</unblocks>
</task_context>

# Tarefa 2.0: Criação da UI Desktop Login (JSX, Tailwind, Figma tokens)

## Visão Geral
Criar a nova interface visual `DesktopLoginView.tsx` replicando a experiência "Corporate Modern" desenhada no Figma, com layout de painel dividido (Split Layout) usando Tailwind CSS.

## Requisitos
- Implementar painel esquerdo visual com imagem estática e sobreposições (overlays atmosféricos azuis e logo).
- Implementar painel direito centralizado verticalmente para o formulário.
- Construir os campos (Inputs) com 56px de altura, ícones no prefixo e botão "Mostrar/Ocultar Senha" interativo.
- Renderizar bloco "Contas de Demonstração" no rodapé do painel direito (admin/operador).
- Usar tipografia (Hanken Grotesk) e as cores corporativas descritas no `configs.md` (`#0066FF`, `#F9F9FF`, `#F1F5F9`).

## Subtarefas
- [ ] 2.1 Criar o componente visual `DesktopLoginView.tsx` consumindo a interface `LoginPresentationProps`.
- [ ] 2.2 Estruturar Painel Esquerdo com `bg-image` (imagem `image2` referenciada de `task4/img`).
- [ ] 2.3 Estruturar Painel Direito do formulário com botões de 56px de altura.
- [ ] 2.4 Implementar funcionalidade "Toggle Senha" (estado local só para visibilidade de texto).

## Sequenciamento
- Bloqueado por: 1.0 (para compartilhar a interface Props)
- Desbloqueia: 3.0
- Paralelizável: Sim

## Detalhes de Implementação
Baseie-se nos tokens descritos em `configs.md` (spacing: input-height 56px, rounded: lg) e nas proporções do Figma. 

## Critérios de Sucesso
- `DesktopLoginView.tsx` finalizado e visualmente idêntico ao Figma.
- Formulário usa o componente injetado de estado (props) para despachar valores.
