# 📋 UI Brief — [Nome do Projeto]

> Preencha este documento antes de iniciar qualquer trabalho de design ou desenvolvimento de UI.
> Compartilhe com designers, desenvolvedores ou IAs para alinhar expectativas.

---

## 1. Informações Gerais

| Campo | Valor |
|---|---|
| **Nome do projeto** | |
| **Data** | |
| **Responsável** | |
| **Versão** | v1.0 |

---

## 2. Visão Geral do Produto

**O que é o produto?**
> _Descreva em 2-3 frases o que o produto faz e qual problema resolve._

**Quem é o usuário principal?**
> _Ex: Gestores de eventos corporativos, 30-45 anos, usam desktop no trabalho._

**Qual é o objetivo principal da interface?**
> _Ex: Permitir que o usuário crie e gerencie eventos em menos de 5 minutos._

---

## 3. Tipo de Produto

- [ ] SaaS
- [ ] E-commerce
- [ ] Landing Page
- [ ] Dashboard / Painel Admin
- [ ] App Móvel
- [ ] Blog / Portfólio
- [ ] Outro: ___________

**Setor:**
- [ ] Saúde
- [ ] Fintech
- [ ] Beleza / Bem-estar
- [ ] Educação
- [ ] Jogos
- [ ] Varejo / Moda
- [ ] Tecnologia / SaaS
- [ ] Eventos / Entretenimento
- [ ] Outro: ___________

---

## 4. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Front-end** | [ ] html-tailwind / [ ] React / [ ] Next.js / [ ] Vue / [ ] Svelte |
| **Mobile** | [ ] React Native / [ ] Flutter / [ ] SwiftUI |
| **Componentes** | [ ] shadcn/ui / [ ] Radix / [ ] Headless UI / [ ] Nenhum |
| **Gráficos** | [ ] Recharts / [ ] Chart.js / [ ] ApexCharts / [ ] D3.js |

---

## 5. Identidade Visual

### Estilo Principal
> Escolha 1-2 estilos que representam a marca:

- [ ] Glassmorphism — moderno, translúcido, premium
- [ ] Claymorphism — suave, lúdico, acolhedor
- [ ] Minimalismo — limpo, direto, profissional
- [ ] Brutalismo — ousado, criativo, disruptivo
- [ ] Neumorphism — suave, elegante, tátil
- [ ] Bento Grid — organizado, moderno, assimétrico
- [ ] Design Flat — simples, acessível, leve
- [ ] Skeuomorphism — realista, familiar, detalhado
- [ ] Outro: ___________

### Tom / Mood
> Descreva em até 5 adjetivos:

`___________` `___________` `___________` `___________` `___________`

### Modo
- [ ] Escuro (dark mode padrão)
- [ ] Claro (light mode padrão)
- [ ] Ambos com toggle

---

## 6. Paleta de Cores

| Função | Cor (hex ou descrição) |
|---|---|
| **Cor primária** | |
| **Cor secundária** | |
| **Acento / Destaque** | |
| **Fundo (background)** | |
| **Texto principal** | |
| **Texto secundário** | |
| **Erro** | |
| **Sucesso** | |
| **Aviso** | |

> Se não souber, descreva o setor/mood e deixe a IA recomendar.
> Referência: use a `ui-ux-pro-max` com `--domain color "[setor]"`.

---

## 7. Tipografia

| Uso | Fonte | Peso(s) |
|---|---|---|
| **Títulos (h1–h3)** | | Bold / Semibold |
| **Corpo do texto** | | Regular |
| **Labels / Legendas** | | Medium |
| **Código (se aplicável)** | | Regular |

> Tamanho mínimo para mobile: **16px** para corpo.
> Line-height: **1.5–1.75** para texto do corpo.

---

## 8. Páginas e Componentes

### Páginas necessárias
| Página | Prioridade | Observações |
|---|---|---|
| | Alta / Média / Baixa | |
| | | |

### Componentes necessários
- [ ] Navbar (tipo: fixa / flutuante / simples)
- [ ] Hero / Banner
- [ ] Cards (produto / serviço / depoimento)
- [ ] Formulário (login / cadastro / contato)
- [ ] Modal / Dialog
- [ ] Sidebar
- [ ] Tabela de dados
- [ ] Gráficos / Charts
- [ ] Tabela de preços / Pricing
- [ ] Footer
- [ ] Outro: ___________

---

## 9. Animações e Interações

| Elemento | Comportamento esperado |
|---|---|
| Hover em botões | |
| Hover em cards | |
| Abertura de modais | |
| Scroll da página | |
| Carregamento de dados | |
| Transições de rota/página | |

> Duração padrão recomendada: **150–300ms**
> Usar `transform` e `opacity`, nunca `width`/`height` para animações.

---

## 10. Referências Visuais

**Sites / apps de inspiração:**
1.
2.
3.

**O que você gosta nessas referências?**
>

**O que você quer evitar?**
>

---

## 11. Requisitos de Acessibilidade

- [ ] Contraste mínimo 4,5:1 para texto normal
- [ ] Estados de foco visíveis (navegação por teclado)
- [ ] Texto alternativo em todas as imagens
- [ ] Labels em todos os campos de formulário
- [ ] Tamanho mínimo de alvo de toque: 44x44px
- [ ] Suporte a `prefers-reduced-motion`
- [ ] Compatibilidade com leitores de tela (ARIA)

---

## 12. Restrições e Observações

**Restrições técnicas:**
>

**Restrições de marca/identidade:**
>

**Prazo:**
>

**Outras observações:**
>

---

## 13. Entregáveis Esperados

> **Stack do projeto: React + Tailwind CSS**

- [ ] Componente React completo (`.tsx`) com classes Tailwind
- [ ] Apenas estrutura/boilerplate inicial do componente
- [ ] Configuração do `tailwind.config.ts` (tokens: cores, fontes, espaçamento, sombras)
- [ ] Variáveis CSS customizadas em `globals.css` (para valores não cobertos pelo Tailwind)
- [ ] Hook customizado (ex: `useModal`, `useTheme`, `useMediaQuery`)
- [ ] Página completa (React Router)
- [ ] Revisão e melhorias de componente existente
- [ ] Documentação de estilo do projeto (style guide)

### Formato esperado do código
- **Componente**: função nomeada exportada (`export function NomeDoComponente`)
- **Props**: interface TypeScript definida acima do componente
- **Classes**: Tailwind utilitários; sem `style={{}}` inline salvo exceções
- **Ícones**: Lucide React (`import { IconName } from 'lucide-react'`)
- **Fontes**: via import no `index.css`

---

_Última atualização: [DATA]_
