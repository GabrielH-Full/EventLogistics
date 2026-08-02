---
name: ui-ux-pro-max
description: "Inteligência de design UI/UX. 50 estilos, 21 paletas, 50 combinações de fontes, 20 gráficos, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Ações: planejar, construir, criar, projetar, implementar, revisar, corrigir, melhorar, otimizar, aprimorar, refatorar, verificar código de UI/UX. Projetos: website, landing page, dashboard, painel administrativo, e-commerce, SaaS, portfólio, blog, aplicativo móvel, .html, .tsx, .vue, .svelte. Elementos: botão, modal, navbar, sidebar, card, tabela, formulário, gráfico. Estilos: glassmorphism, claymorphism, minimalismo, brutalismo, neumorphism, bento grid, modo escuro, responsivo, skeuomorphism, design flat. Tópicos: paleta de cores, acessibilidade, animação, layout, tipografia, combinação de fontes, espaçamento, hover, sombra, gradiente. Integrações: shadcn/ui MCP para busca de componentes e exemplos."
---

# UI/UX Pro Max - Inteligência de Design

Guia de design abrangente para aplicações web e móveis. Contém mais de 50 estilos, 97 paletas de cores, 57 combinações de fontes, 99 diretrizes de UX e 25 tipos de gráficos em 9 stacks de tecnologia. Banco de dados pesquisável com recomendações baseadas em prioridade.

## Quando Aplicar

Consulte estas diretrizes ao:
- Projetar novos componentes de UI ou páginas
- Escolher paletas de cores e tipografia
- Revisar código em busca de problemas de UX
- Construir landing pages ou dashboards
- Implementar requisitos de acessibilidade

## Categorias de Regras por Prioridade

| Prioridade | Categoria | Impacto | Domínio |
|----------|----------|--------|--------|
| 1 | Acessibilidade | CRÍTICO | `ux` |
| 2 | Toque e Interação | CRÍTICO | `ux` |
| 3 | Desempenho | ALTO | `ux` |
| 4 | Layout e Responsividade | ALTO | `ux` |
| 5 | Tipografia e Cor | MÉDIO | `typography`, `color` |
| 6 | Animação | MÉDIO | `ux` |
| 7 | Seleção de Estilo | MÉDIO | `style`, `product` |
| 8 | Gráficos e Dados | BAIXO | `chart` |

## Referência Rápida

### 1. Acessibilidade (CRÍTICO)

- `color-contrast` - Proporção mínima de 4,5:1 para texto normal
- `focus-states` - Anéis de foco visíveis em elementos interativos
- `alt-text` - Texto alternativo descritivo para imagens significativas
- `aria-labels` - aria-label para botões apenas com ícone
- `keyboard-nav` - Ordem de tabulação corresponde à ordem visual
- `form-labels` - Use label com atributo for

### 2. Toque e Interação (CRÍTICO)

- `touch-target-size` - Alvos de toque de no mínimo 44x44px
- `hover-vs-tap` - Use clique/toque para interações primárias
- `loading-buttons` - Desative o botão durante operações assíncronas
- `error-feedback` - Mensagens de erro claras próximas ao problema
- `cursor-pointer` - Adicione cursor-pointer a elementos clicáveis

### 3. Desempenho (ALTO)

- `image-optimization` - Use WebP, srcset, carregamento lazy
- `reduced-motion` - Verifique prefers-reduced-motion
- `content-jumping` - Reserve espaço para conteúdo assíncrono

### 4. Layout e Responsividade (ALTO)

- `viewport-meta` - width=device-width initial-scale=1
- `readable-font-size` - Tamanho mínimo de 16px para texto do corpo em dispositivos móveis
- `horizontal-scroll` - Garanta que o conteúdo caiba na largura do viewport
- `z-index-management` - Defina uma escala de z-index (10, 20, 30, 50)

### 5. Tipografia e Cor (MÉDIO)

- `line-height` - Use 1,5-1,75 para texto do corpo
- `line-length` - Limite a 65-75 caracteres por linha
- `font-pairing` - Combine as personalidades das fontes de título/corpo

### 6. Animação (MÉDIO)

- `duration-timing` - Use 150-300ms para microinterações
- `transform-performance` - Use transform/opacity, não width/height
- `loading-states` - Telas de esqueleto (skeleton) ou spinners

### 7. Seleção de Estilo (MÉDIO)

- `style-match` - Combine o estilo com o tipo de produto
- `consistency` - Use o mesmo estilo em todas as páginas
- `no-emoji-icons` - Use ícones SVG, não emojis

### 8. Gráficos e Dados (BAIXO)

- `chart-type` - Combine o tipo de gráfico com o tipo de dado
- `color-guidance` - Use paletas de cores acessíveis
- `data-table` - Forneça uma alternativa em tabela para acessibilidade

## Como Usar

Pesquise domínios específicos usando a ferramenta de linha de comando (CLI) abaixo.

---

## Pré-requisitos

Verifique se o Python está instalado:

```bash
python3 --version || python --version
```

Se o Python não estiver instalado, instale-o de acordo com o sistema operacional do usuário:

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## Como Usar Esta Skill

Quando o usuário solicitar trabalho de UI/UX (projetar, construir, criar, implementar, revisar, corrigir, melhorar), siga este fluxo de trabalho:

### Etapa 1: Analise os Requisitos do Usuário

Extraia informações-chave do pedido do usuário:
- **Tipo de produto**: SaaS, e-commerce, portfólio, dashboard, landing page, etc.
- **Palavras-chave de estilo**: minimalista, divertido, profissional, elegante, modo escuro, etc.
- **Setor**: saúde, fintech, jogos, educação, etc.
- **Stack**: React, Vue, Next.js, ou padrão `html-tailwind`

### Etapa 2: Gere o Sistema de Design (OBRIGATÓRIO)

**Sempre comece com `--design-system`** para obter recomendações abrangentes com justificativa:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<tipo_de_produto> <setor> <palavras-chave>" --design-system [-p "Nome do Projeto"]
```

Este comando:
1. Pesquisa 5 domínios em paralelo (produto, estilo, cor, landing, tipografia)
2. Aplica regras de raciocínio de `ui-reasoning.csv` para selecionar as melhores correspondências
3. Retorna um sistema de design completo: padrão, estilo, cores, tipografia, efeitos
4. Inclui anti-padrões a serem evitados

**Exemplo:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Etapa 3: Complemente com Pesquisas Detalhadas (conforme necessário)

Após obter o sistema de design, use pesquisas de domínio para obter detalhes adicionais:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<palavra-chave>" --domain <domínio> [-n <máx_resultados>]
```

**Quando usar pesquisas detalhadas:**

| Necessidade | Domínio | Exemplo |
|------|--------|---------|
| Mais opções de estilo | `style` | `--domain style "glassmorphism dark"` |
| Recomendações de gráficos | `chart` | `--domain chart "real-time dashboard"` |
| Melhores práticas de UX | `ux` | `--domain ux "animation accessibility"` |
| Fontes alternativas | `typography` | `--domain typography "elegant luxury"` |
| Estrutura de landing page | `landing` | `--domain landing "hero social-proof"` |

### Etapa 4: Diretrizes de Stack (Padrão: html-tailwind)

Obtenha melhores práticas específicas de implementação. Se o usuário não especificar uma stack, **use `html-tailwind` como padrão**.

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<palavra-chave>" --stack html-tailwind
```

Stacks disponíveis: `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`

---

## Referência de Pesquisa

### Domínios Disponíveis

| Domínio | Usar Para | Palavras-chave de Exemplo |
|--------|---------|------------------|
| `product` | Recomendações de tipo de produto | SaaS, e-commerce, portfólio, saúde, beleza, serviço |
| `style` | Estilos de UI, cores, efeitos | glassmorphism, minimalismo, modo escuro, brutalismo |
| `typography` | Combinações de fontes, Google Fonts | elegante, divertido, profissional, moderno |
| `color` | Paletas de cores por tipo de produto | saas, e-commerce, saúde, beleza, fintech, serviço |
| `landing` | Estrutura de página, estratégias de CTA | hero, hero-centric, depoimento, preços, prova social |
| `chart` | Tipos de gráfico, recomendações de biblioteca | tendência, comparação, linha do tempo, funil, pizza |
| `ux` | Melhores práticas, anti-padrões | animação, acessibilidade, z-index, carregamento |
| `react` | Desempenho de React/Next.js | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | Diretrizes de interface web | aria, foco, teclado, semântico, virtualizar |
| `prompt` | Prompts de IA, palavras-chave CSS | (nome do estilo) |

### Stacks Disponíveis

| Stack | Foco |
|-------|-------|
| `html-tailwind` | Utilitários Tailwind, responsividade, a11y (PADRÃO) |
| `react` | Estado, hooks, desempenho, padrões |
| `nextjs` | SSR, roteamento, imagens, rotas de API |
| `vue` | Composition API, Pinia, Vue Router |
| `svelte` | Runes, stores, SvelteKit |
| `swiftui` | Views, State, Navigation, Animation |
| `react-native` | Componentes, Navegação, Listas |
| `flutter` | Widgets, Estado, Layout, Temas |
| `shadcn` | Componentes shadcn/ui, temas, formulários, padrões |

---

## Fluxo de Trabalho de Exemplo

**Pedido do usuário:** "Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp" (Fazer uma landing page para um serviço profissional de cuidados com a pele)

### Etapa 1: Analise os Requisitos
- Tipo de produto: Serviço de beleza/spa
- Palavras-chave de estilo: elegante, profissional, suave
- Setor: Beleza/Bem-estar
- Stack: html-tailwind (padrão)

### Etapa 2: Gere o Sistema de Design (OBRIGATÓRIO)

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

**Saída:** Sistema de design completo com padrão, estilo, cores, tipografia, efeitos e anti-padrões.

### Etapa 3: Complemente com Pesquisas Detalhadas (conforme necessário)

```bash
# Obter diretrizes de UX para animação e acessibilidade
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "animation accessibility" --domain ux

# Obter opções de tipografia alternativas, se necessário
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "elegant luxury serif" --domain typography
```

### Etapa 4: Diretrizes de Stack

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "layout responsive form" --stack html-tailwind
```

**Depois:** Sintetize o sistema de design + pesquisas detalhadas e implemente o design.

---

## Formatos de Saída

A flag `--design-system` suporta dois formatos de saída:

```bash
# Caixa ASCII (padrão) - melhor para exibição no terminal
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown - melhor para documentação
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Dicas para Melhores Resultados

1. **Seja específico com as palavras-chave** - "dashboard SaaS de saúde" é melhor que "app"
2. **Pesquise múltiplas vezes** - Palavras-chave diferentes revelam insights diferentes
3. **Combine domínios** - Estilo + Tipografia + Cor = Sistema de design completo
4. **Sempre verifique a UX** - Pesquise "animação", "z-index", "acessibilidade" para problemas comuns
5. **Use a flag de stack** - Obtenha melhores práticas específicas de implementação
6. **Itere** - Se a primeira pesquisa não corresponder, tente palavras-chave diferentes

---

## Regras Comuns para UI Profissional

Estes são problemas frequentemente ignorados que fazem a UI parecer não profissional:

### Ícones e Elementos Visuais

| Regra | Faça | Não Faça |
|------|----|----- |
| **Sem ícones de emoji** | Use ícones SVG (Heroicons, Lucide, Simple Icons) | Use emojis como 🎨 🚀 ⚙️ como ícones de UI |
| **Estados de hover estáveis** | Use transições de cor/opacidade no hover | Use transformações de escala que deslocam o layout |
| **Logotipos de marca corretos** | Pesquise o SVG oficial no Simple Icons | Adivinhe ou use caminhos de logotipo incorretos |
| **Tamanho de ícone consistente** | Use viewBox fixo (24x24) com w-6 h-6 | Misture diferentes tamanhos de ícone aleatoriamente |

### Interação e Cursor

| Regra | Faça | Não Faça |
|------|----|----- |
| **Cursor pointer** | Adicione `cursor-pointer` a todos os cards clicáveis/em hover | Deixe o cursor padrão em elementos interativos |
| **Feedback de hover** | Forneça feedback visual (cor, sombra, borda) | Nenhuma indicação de que o elemento é interativo |
| **Transições suaves** | Use `transition-colors duration-200` | Mudanças de estado instantâneas ou muito lentas (>500ms) |

### Contraste em Modo Claro/Escuro

| Regra | Faça | Não Faça |
|------|----|----- |
| **Card de vidro em modo claro** | Use `bg-white/80` ou opacidade maior | Use `bg-white/10` (transparente demais) |
| **Contraste de texto em modo claro** | Use `#0F172A` (slate-900) para texto | Use `#94A3B8` (slate-400) para texto do corpo |
| **Texto suave em modo claro** | Use `#475569` (slate-600) no mínimo | Use gray-400 ou mais claro |
| **Visibilidade de borda** | Use `border-gray-200` em modo claro | Use `border-white/10` (invisível) |

### Layout e Espaçamento

| Regra | Faça | Não Faça |
|------|----|----- |
| **Navbar flutuante** | Adicione espaçamento `top-4 left-4 right-4` | Fixe a navbar em `top-0 left-0 right-0` |
| **Preenchimento de conteúdo** | Considere a altura da navbar fixa | Deixe o conteúdo esconder atrás de elementos fixos |
| **Largura máxima consistente** | Use o mesmo `max-w-6xl` ou `max-w-7xl` | Misture diferentes larguras de contêiner |

---

## Checklist Pré-Entrega

Antes de entregar o código de UI, verifique estes itens:

### Qualidade Visual
- [ ] Nenhum emoji usado como ícone (use SVG em vez disso)
- [ ] Todos os ícones de um conjunto de ícones consistente (Heroicons/Lucide)
- [ ] Logotipos de marca corretos (verificados no Simple Icons)
- [ ] Estados de hover não causam deslocamento de layout
- [ ] Use cores do tema diretamente (bg-primary), não o wrapper var()

### Interação
- [ ] Todos os elementos clicáveis têm `cursor-pointer`
- [ ] Estados de hover fornecem feedback visual claro
- [ ] Transições são suaves (150-300ms)
- [ ] Estados de foco visíveis para navegação por teclado

### Modo Claro/Escuro
- [ ] Texto em modo claro tem contraste suficiente (mínimo 4,5:1)
- [ ] Elementos de vidro/transparentes visíveis em modo claro
- [ ] Bordas visíveis em ambos os modos
- [ ] Teste ambos os modos antes da entrega

### Layout
- [ ] Elementos flutuantes têm espaçamento adequado das bordas
- [ ] Nenhum conteúdo escondido atrás de navbars fixas
- [ ] Responsivo em 375px, 768px, 1024px, 1440px
- [ ] Sem rolagem horizontal em dispositivos móveis

### Acessibilidade
- [ ] Todas as imagens têm texto alternativo
- [ ] Campos de formulário têm labels
- [ ] A cor não é o único indicador
- [ ] `prefers-reduced-motion` respeitado