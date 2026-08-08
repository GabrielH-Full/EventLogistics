---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>frontend/auth</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>None</dependencies>
<unblocks>"2.0", "3.0"</unblocks>
</task_context>

# Tarefa 1.0: Refatoração do Mobile Login (Extrair UI atual)

## Visão Geral
Isolar o JSX e estilos atuais do `LoginView.tsx` (versão mobile) para um componente estritamente visual (`MobileLoginView.tsx`), de modo que o `LoginView.tsx` principal possa se tornar um Wrapper de estado.

## Requisitos
- Criar o arquivo `MobileLoginView.tsx` na pasta `frontend/src/auth`.
- O novo componente deve receber o estado (`username`, `password`, `error`, `submitting`) e callbacks via propriedades (`LoginPresentationProps`).
- Transferir todo o JSX do formulário de login (atualmente em `LoginView.tsx`) para este arquivo sem alterar as classes Tailwind ou lógica.

## Subtarefas
- [ ] 1.1 Definir a interface `LoginPresentationProps`.
- [ ] 1.2 Criar e exportar o componente `MobileLoginView`.
- [ ] 1.3 Assegurar que os ícones `lucide-react` continuam importados corretamente.

## Sequenciamento
- Bloqueado por: Nenhuma
- Desbloqueia: 2.0, 3.0
- Paralelizável: Sim

## Detalhes de Implementação
Consulte a **Especificação Técnica**: "Visão Geral dos Componentes" e "Interfaces Principais" para usar as propriedades sugeridas para injeção de dependência.

## Critérios de Sucesso
- A lógica do Mobile Login está separada em um arquivo próprio e não possui hooks complexos de estado internamente.
