# 📄 PRD de Frontend — [Nome da Feature / Tela]

> **Product Requirements Document focado em implementação frontend.**
> Une o design extraído do Figma com os padrões de qualidade UI/UX do projeto.
> Preencha antes de solicitar implementação a uma IA ou desenvolvedor.

**Versão:** v1.0
**Data:** [DATA]
**Responsável:** [NOME]
**Status:** [ ] Rascunho · [ ] Revisão · [ ] Aprovado · [ ] Em desenvolvimento · [ ] Concluído

---

## 1. Visão Geral

**O que é esta feature/tela?**
> _Descreva em 2-3 frases o que será construído e qual problema resolve para o usuário._

**Por que é importante?**
> _Contexto de negócio ou produto que justifica esta implementação._

**Quem vai usar?**
> _Ex: Gestor de eventos logado no sistema, acessando via desktop._

---

## 2. Links do Figma

> **Como usar:** Copie o link exato do frame/camada no Figma (botão direito → "Copy link to selection").
> A IA usa esses links para extrair design context, screenshot e assets automaticamente.

| Tela / Componente | Link do Figma | Variante / Estado | Notas |
|---|---|---|---|
| Tela principal | `https://www.figma.com/file/...` | Default | |
| Estado de loading | `https://www.figma.com/file/...` | Loading | |
| Estado de erro | `https://www.figma.com/file/...` | Error | |
| Estado vazio | `https://www.figma.com/file/...` | Empty state | |
| Mobile | `https://www.figma.com/file/...` | Mobile 375px | |
| [Adicione mais] | | | |

### Fluxo obrigatório ao usar os links com a IA

```
1. get_design_context  → estrutura e tokens do nó
2. get_screenshot      → referência visual da variante
3. Download dos assets → ícones/imagens do payload Figma
4. Implementação       → React + Tailwind alinhado ao design system
5. Validação           → paridade 1:1 com a captura do Figma
```

> ⚠️ **Não pule etapas.** Sempre obtenha `get_design_context` + `get_screenshot` antes de implementar.

---

## 3. Stack e Contexto Técnico

| Campo | Valor |
|---|---|
| **Framework** | React (Vite + React Router) |
| **Estilização** | Tailwind CSS |
| **Linguagem** | TypeScript |
| **Ícones** | Lucide React |
| **Fontes** | Import no `index.css` |
| **Gráficos** | Recharts (se aplicável) |
| **Componentes base** | [shadcn/ui / Radix / Headless UI / Nenhum] |
| **Gerenciamento de estado** | [useState / Zustand / Redux / Context API] |
| **Busca de dados** | [fetch / TanStack Query / SWR / Axios] |

### Arquivos relevantes do projeto

| Arquivo | Descrição |
|---|---|
| `tailwind.config.ts` | Tokens de cor, fonte e espaçamento do design system |
| `src/index.css` | Variáveis CSS globais e imports de fontes |
| `src/components/ui/` | Componentes base reutilizáveis |
| `src/pages/` | Páginas da aplicação |
| [Outros] | |

---

## 4. Design System — Tokens do Projeto

> Extraídos do `tailwind.config.ts` e do `style-guide.md`.
> A IA deve reutilizar estes tokens em vez de criar valores arbitrários.

### Cores

```ts
// tailwind.config.ts — theme.extend.colors
colors: {
  primary: '#______',      // Botões principais, links, destaques
  'primary-dark': '#______', // Hover de botões
  secondary: '#______',
  accent: '#______',
  background: '#______',
  surface: '#______',
  border: '#______',
  'text-primary': '#______',
  'text-secondary': '#______',
  success: '#______',
  warning: '#______',
  error: '#______',
}
```

### Fontes

```css
/* index.css */
--font-heading: '______', sans-serif;
--font-body: '______', sans-serif;
```

### Outros tokens relevantes

```ts
// Sombras, border-radius, animações customizadas do projeto
// Cole aqui os valores do seu tailwind.config.ts
```

---

## 5. Componentes Necessários

### Componentes novos a criar

| Componente | Arquivo sugerido | Reutilizável? | Descrição |
|---|---|---|---|
| `NomeDoComponente` | `src/components/NomeDoComponente.tsx` | Sim / Não | |
| | | | |

### Componentes existentes a reutilizar

| Componente | Localização | Como usar nesta tela |
|---|---|---|
| | `src/components/ui/` | |
| | | |

### Estrutura de Props esperada (por componente)

```tsx
// Exemplo — preencha para cada componente novo
interface NomeDoComponenteProps {
  // prop: tipo   // descrição
}
```

---

## 6. Requisitos Funcionais

> O que a tela precisa **fazer** (comportamento, não visual).

| ID | Requisito | Prioridade | Notas |
|---|---|---|---|
| RF-01 | | Alta / Média / Baixa | |
| RF-02 | | | |
| RF-03 | | | |

---

## 7. Estados da UI

> Cada tela deve cobrir todos os estados possíveis. Mapeie-os aqui.

| Estado | Descrição | Link Figma | Comportamento esperado |
|---|---|---|---|
| **Default** | Estado padrão com dados carregados | | |
| **Loading** | Dados sendo buscados | | Skeleton screen ou spinner |
| **Empty** | Sem dados para exibir | | Ilustração + CTA |
| **Error** | Falha na requisição | | Mensagem de erro + botão de retry |
| **Hover** | Elemento interativo em hover | | Feedback visual (cor/sombra) |
| **Focus** | Elemento com foco via teclado | | Outline visível |
| **Disabled** | Elemento inativo | | Opacidade 50%, cursor-not-allowed |
| [Outros] | | | |

---

## 8. Requisitos de Responsividade

| Breakpoint | Largura | Layout esperado |
|---|---|---|
| Mobile | 375px | |
| Tablet | 768px | |
| Desktop | 1024px | |
| Wide | 1440px | |

> **Mobile-first:** Implemente sempre do menor para o maior breakpoint.
> Sem rolagem horizontal em nenhum breakpoint.

---

## 9. Animações e Interações

| Elemento | Interação | Duração | Easing | Notas |
|---|---|---|---|---|
| Botões | Hover (cor/sombra) | 150ms | ease-default | |
| Cards | Hover (shadow-md + borda) | 200ms | ease-default | |
| Modal | Abertura | 300ms | ease-out | |
| | Fechamento | 200ms | ease-in | |
| Toast | Entrada | 300ms | ease-spring | |
| [Outros] | | | | |

> ✅ Use sempre `transform` e `opacity` para animações (nunca `width`/`height`)
> ✅ Respeite `prefers-reduced-motion`

---

## 10. Requisitos de Acessibilidade

> Baseados nas regras CRÍTICAS da `ui-ux-pro-max`.

- [ ] Contraste de texto ≥ 4,5:1 em todos os elementos de texto
- [ ] Estados de foco visíveis em todos os elementos interativos (`outline: 2px solid primary`)
- [ ] Todas as imagens com atributo `alt` descritivo (ou `alt=""` se decorativa)
- [ ] Todos os campos de formulário com `<label>` vinculado (`htmlFor`)
- [ ] Botões de apenas ícone com `aria-label`
- [ ] Tamanho mínimo de alvo de toque: **44×44px**
- [ ] Nenhuma ação crítica dependente apenas de cor
- [ ] `prefers-reduced-motion` respeitado

---

## 11. Checklist de Qualidade UI

> Baseado no checklist pré-entrega da `ui-ux-pro-max`. Valide antes de marcar como concluído.

### Visual
- [ ] Nenhum emoji usado como ícone (somente Lucide React)
- [ ] Todos os ícones do mesmo conjunto e tamanho consistente
- [ ] Hover nos cards não causa deslocamento de layout
- [ ] Tokens de cor do projeto usados (não valores hardcoded)

### Interação
- [ ] `cursor-pointer` em todos os elementos clicáveis
- [ ] Feedback visual em hover (cor, sombra ou borda)
- [ ] Transições de 150–300ms
- [ ] Estados de foco visíveis para navegação por teclado
- [ ] Botão desativado durante operações assíncronas

### Modo Claro/Escuro (se aplicável)
- [ ] Contraste adequado em ambos os modos
- [ ] Elementos glassmorphism visíveis em modo claro (`bg-white/80`, não `bg-white/10`)
- [ ] Bordas visíveis (`border-gray-200` em claro)

### Layout
- [ ] Responsivo em 375px, 768px, 1024px, 1440px
- [ ] Sem rolagem horizontal em nenhum breakpoint
- [ ] Conteúdo não escondido atrás de navbars fixas
- [ ] `max-w` consistente nos containers

### Paridade com Figma
- [ ] Screenshot do Figma comparado com a implementação
- [ ] Espaçamentos, tamanhos de fonte e cores conferem
- [ ] Assets (ícones/imagens) usam as fontes do Figma MCP (localhost), não placeholders

---

## 12. Critérios de Aceite

> A feature só está "pronta" quando todos os critérios abaixo forem atendidos.

| # | Critério | Como verificar |
|---|---|---|
| 1 | Paridade visual 1:1 com o Figma | Comparar screenshot do Figma com a implementação |
| 2 | Todos os estados da UI implementados | Testar cada estado manualmente |
| 3 | Responsivo em todos os breakpoints | Testar em DevTools (375px, 768px, 1024px, 1440px) |
| 4 | Checklist de qualidade UI 100% | Revisar seção 11 |
| 5 | Sem erros no console | Inspecionar DevTools → Console |
| 6 | TypeScript sem erros | `tsc --noEmit` passa sem erros |
| [Outros] | | |

---

## 13. Fora do Escopo

> Explícito o que **não** faz parte desta implementação (para evitar scope creep).

- [ ]
- [ ]

---

## 14. Notas e Contexto Adicional

> Qualquer informação relevante que não se encaixou nas seções acima.

>

---

## 15. Decisões de Design Registradas

> Referência ao [Design Decision Log](../ai-ui-ux-pro-max/templates/design-decision-log.md) para decisões tomadas durante a implementação desta feature.

| DDL ID | Decisão | Impacto nesta tela |
|---|---|---|
| DDL-00x | | |

---

_Última atualização: [DATA] · Responsável: [NOME]_
