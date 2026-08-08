---
status: completed
parallelizable: false
blocked_by: ["1.0", "2.0"]
---

<task_context>
<domain>frontend/auth</domain>
<type>integration</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>external_assets</dependencies>
<unblocks>None</unblocks>
</task_context>

# Tarefa 3.0: Integração Responsiva no LoginView Principal

## Visão Geral
Atualizar o componente contêiner `LoginView.tsx` para gerenciar o estado da autenticação e envolver `MobileLoginView` e `DesktopLoginView`, garantindo que apenas a versão correta seja exibida usando Media Queries CSS.

## Requisitos
- Remover retorno JSX antigo de `LoginView.tsx` e instanciar estado.
- Adicionar divs contêiner com `className="block lg:hidden"` para renderizar o Mobile, e `className="hidden lg:block lg:flex w-full min-h-screen"` para renderizar o Desktop.
- Assegurar que os assets (fontes globais "Hanken Grotesk" e imagens) estejam acessíveis para a página ou configurados no `index.css`.
- Testar comportamento com dados inseridos (se a janela mudar de tamanho, o input de usuário *não* deve zerar, provando o Lifting State Up).

## Subtarefas
- [ ] 3.1 Copiar/Garantir que a imagem da pasta `task4/img` está presente no repositório final (`public/` ou assets) para que a UI de desktop consiga renderizar.
- [ ] 3.2 Refatorar `LoginView.tsx` como Container Component.
- [ ] 3.3 Testar preenchimento na transição de breakpoint `1024px`.

## Sequenciamento
- Bloqueado por: 1.0, 2.0
- Desbloqueia: Nenhuma (Deploy final)
- Paralelizável: Não

## Detalhes de Implementação
De acordo com o PRD, optamos por responsividade via CSS para poupar recursos computacionais, garantindo um "paint" ultra-rápido nas máquinas locais e terminais da empresa.

## Critérios de Sucesso
- A página de login carrega e renderiza instantaneamente o layout Desktop se a tela tiver pelo menos 1024px de largura, sem qualquer resquício visual da versão de celular.
