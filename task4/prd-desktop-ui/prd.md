# PRD: Nova Tela de Login (Desktop)

## Visão Geral

A interface atual de login do EventLogistics atende bem a dispositivos móveis, porém, quando acessada através de monitores Desktop (Caixa Central, Gestores Logísticos, Administradores), a experiência torna-se desproporcional. Este PRD detalha a criação de uma **nova tela de login otimizada para Desktop**, baseada na linguagem de design "Corporate Modern", sem impactar ou alterar o layout mobile existente.

## Objetivos

- **Proporcionar uma experiência nativa para Desktop**: Preencher a tela adequadamente em monitores maiores usando um layout de painel duplo (Split Layout).
- **Manter retrocompatibilidade Mobile**: Usuários em smartphones ("moba") devem continuar vendo exatamente a mesma interface de login atual.
- **Acelerar a integração**: Incluir diretamente na UI as credenciais de demonstração do sistema para facilitar o acesso de testes.
- **Transmmitir Confiança (Branding)**: Aplicar paleta de cores corporativa, com imagens imersivas que reforcem a marca "Operações Estratégicas".

## Histórias de Usuário

- **Como Gestor do Caixa Central (Desktop)**, eu quero acessar uma tela de login que aproveite todo o espaço do meu monitor, para me passar a sensação de um software robusto e profissional.
- **Como Operador de Barraca (Mobile)**, eu quero que minha tela de login continue leve, vertical e focada, para não prejudicar meu acesso via tablet ou celular.
- **Como Usuário de Demonstração**, eu quero poder copiar/ler as contas de acesso (admin/operador) direto da tela de login, para não ter que buscar senhas em outros documentos.

## Funcionalidades Principais

1. **Roteamento/Renderização Condicional (Mobile vs Desktop)**
   - O sistema detectará o tamanho da tela (via CSS Media Queries ou hook de Resize no React) e apresentará o Componente "Login Desktop" para telas grandes (ex: `min-width: 1024px`) ou manterá o "Login Mobile" para menores.
   - *Importante:* A lógica de autenticação (chamadas à API, tokens) será reaproveitada entre ambos.

2. **Layout de Painel Duplo (Split Screen - Desktop)**
   - **Painel Esquerdo (Branding/Visual)**: Ocupará parte da tela contendo uma imagem de fundo ("image 2"), overlays atmosféricos azuis, um gradiente sombreado, o logo/ícone da aplicação, e os textos institucionais ("Operações Estratégicas", "Gestão unificada para o ecossistema...").
   - **Painel Direito (Formulário)**: Um contêiner branco limpo e centralizado verticalmente contendo o formulário real.

3. **Formulário de Acesso Modernizado**
   - Campos com ícones prefixados e textos de *placeholder* descritivos.
   - Componente de senha com alternância (Toggle) para visibilidade da senha (ícone de olho).
   - Botão primário expansivo (56px de altura) com sombra e interações de hover/active marcantes.

4. **Cartão de Credenciais de Demonstração**
   - Um bloco "Contas de Demonstração" no rodapé do formulário, com fundo `#E7EEFF`, exibindo explicitamente os logins:
     - `admin / admin123`
     - `operador / log123`

## Experiência do Usuário

- **Acessibilidade**: Os inputs terão labels claras ("USUÁRIO", "SENHA") em tipografia `label-caps`. 
- **Estilo Visual**: Implementado usando as configurações definidas em `configs.md` (Hanken Grotesk, Cores Primary `#0050CB`, Surface `#F9F9FF`, cantos arredondados de 8px e 16px).
- **Tipografia**: Uso pesado de hierarquia visual, com os títulos (`Headline 1` e `Headline 2`) atraindo a atenção e textos de apoio com cores neutras (`#64748B`).

## Restrições Técnicas de Alto Nível

- **Nenhuma quebra mobile permitida**: O layout mobile não deve ser tocado ou afetado negativamente por regras globais de CSS introduzidas aqui.
- **Reaproveitamento de Estado**: O estado do formulário (`username`, `password`, `isSubmitting`, `error`) deve preferencialmente compartilhar o mesmo comportamento já validado.

## Não-Objetivos (Fora de Escopo)

- **Recuperação de Senha**: Funcionalidades de "Esqueci minha senha" continuam de fora do escopo.
- **Registro de Novos Usuários**: Criação de contas não será adicionada na UI.
- **Redesign Mobile**: Nenhuma melhoria estética será aplicada na versão mobile durante esta etapa.

## Questões em Aberto

- **Media Query Threshold**: Definiremos a transição (breakpoint) do mobile para desktop a partir de `1024px` (Tablet Paisagem/Desktop)? Resposta: Sim, usar os media queries já existentes.
- **Separação de Componentes**: O ideal é criar um `DesktopLogin.tsx` e um `MobileLogin.tsx`, decidindo qual carregar, ou tratar tudo via classes CSS no mesmo arquivo? (Sugestão: via CSS ou dois componentes separados se houver muita discrepância na árvore do DOM). Resposta: CSS
