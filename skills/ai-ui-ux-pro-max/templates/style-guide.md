# 🎨 Guia de Estilo — [Nome do Projeto]

> Documento vivo com todas as escolhas de design do projeto.
> Mantenha atualizado conforme o projeto evolui.
> Versão: v1.0 | Última atualização: [DATA]

---

## 1. Visão Geral

| Campo | Valor |
|---|---|
| **Projeto** | |
| **Produto** | SaaS / E-commerce / Dashboard / Landing Page / App Móvel |
| **Setor** | |
| **Stack** | |
| **Estilo principal** | |
| **Modo** | Escuro / Claro / Ambos |

**Personalidade da marca em 3 palavras:**
> `___________` · `___________` · `___________`

---

## 2. Paleta de Cores

### Cores Primárias

| Nome | Hex | HSL | Uso |
|---|---|---|---|
| Primary | `#______` | `hsl(_, _, _)` | Botões, links, destaques principais |
| Primary Dark | `#______` | | Hover de botões primários |
| Primary Light | `#______` | | Fundos, badges, tags |

### Cores Secundárias

| Nome | Hex | HSL | Uso |
|---|---|---|---|
| Secondary | `#______` | | Elementos de suporte |
| Accent | `#______` | | Destaques pontuais, CTAs secundários |

### Neutros

| Nome | Hex | Uso |
|---|---|---|
| Background | `#______` | Fundo principal da página |
| Surface | `#______` | Cards, painéis, modais |
| Surface Elevated | `#______` | Dropdowns, tooltips, popovers |
| Border | `#______` | Bordas e divisores |
| Text Primary | `#______` | Texto principal (contraste ≥ 4.5:1) |
| Text Secondary | `#______` | Texto de suporte, labels |
| Text Muted | `#______` | Placeholders, metadados |

### Semânticas

| Nome | Hex | Uso |
|---|---|---|
| Success | `#______` | Confirmações, estados positivos |
| Warning | `#______` | Alertas, avisos |
| Error | `#______` | Erros, estados negativos |
| Info | `#______` | Informações, dicas |

### Variáveis CSS

```css
:root {
  /* Primárias */
  --color-primary: #______;
  --color-primary-dark: #______;
  --color-primary-light: #______;

  /* Secundárias */
  --color-secondary: #______;
  --color-accent: #______;

  /* Neutros */
  --color-bg: #______;
  --color-surface: #______;
  --color-surface-elevated: #______;
  --color-border: #______;

  /* Texto */
  --color-text-primary: #______;
  --color-text-secondary: #______;
  --color-text-muted: #______;

  /* Semânticas */
  --color-success: #______;
  --color-warning: #______;
  --color-error: #______;
  --color-info: #______;
}
```

---

## 3. Tipografia

### Fontes

| Uso | Família | Google Fonts |
|---|---|---|
| Títulos | | `https://fonts.google.com/specimen/______` |
| Corpo | | `https://fonts.google.com/specimen/______` |
| Código (se aplicável) | JetBrains Mono | |

### Escala Tipográfica

| Token | Tamanho | Line-height | Peso | Uso |
|---|---|---|---|---|
| `text-xs` | 12px | 1.5 | Regular | Legendas, metadados |
| `text-sm` | 14px | 1.5 | Regular | Labels, textos auxiliares |
| `text-base` | 16px | 1.6 | Regular | Corpo do texto (mínimo mobile) |
| `text-lg` | 18px | 1.5 | Medium | Subtítulos menores |
| `text-xl` | 20px | 1.4 | Semibold | Subtítulos |
| `text-2xl` | 24px | 1.3 | Semibold | H3 |
| `text-3xl` | 30px | 1.2 | Bold | H2 |
| `text-4xl` | 36px | 1.1 | Bold | H1 desktop |
| `text-5xl` | 48px | 1.1 | Bold | Hero titles |

### Variáveis CSS

```css
:root {
  --font-heading: '______', sans-serif;
  --font-body: '______', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-base: 1rem;       /* 16px */
  --line-height-body: 1.6;
  --line-height-heading: 1.2;

  /* Limite de linha: 65-75 caracteres */
  --max-prose-width: 65ch;
}
```

---

## 4. Espaçamento

> Baseado em escala de 4px.

| Token | Valor | Uso típico |
|---|---|---|
| `space-1` | 4px | Gaps internos mínimos |
| `space-2` | 8px | Padding interno de badges/tags |
| `space-3` | 12px | Gaps entre elementos próximos |
| `space-4` | 16px | Padding de componentes pequenos |
| `space-5` | 20px | Padding padrão de cards |
| `space-6` | 24px | Gaps entre seções menores |
| `space-8` | 32px | Padding de seções |
| `space-12` | 48px | Gaps entre seções grandes |
| `space-16` | 64px | Padding de seções hero |
| `space-24` | 96px | Espaçamento entre blocos principais |

---

## 5. Sombras e Elevação

| Nível | CSS | Uso |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards sutis, inputs |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards padrão, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modais, popovers |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Elementos flutuantes |
| `shadow-glow` | `0 0 20px rgba(var(--color-primary), 0.3)` | Destaques, botões ativos |

---

## 6. Border Radius

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 4px | Tags, badges, inputs |
| `rounded-md` | 8px | Botões, cards menores |
| `rounded-lg` | 12px | Cards padrão |
| `rounded-xl` | 16px | Modais, painéis |
| `rounded-2xl` | 20px | Elementos destaque |
| `rounded-full` | 9999px | Avatares, pills |

---

## 7. Z-Index

> Escala definida para evitar conflitos de sobreposição.

| Camada | Valor | Uso |
|---|---|---|
| `z-base` | 0 | Elementos padrão |
| `z-raised` | 10 | Cards com hover, elementos flutuantes sutis |
| `z-dropdown` | 20 | Dropdowns, menus |
| `z-sticky` | 30 | Headers fixos, sticky elements |
| `z-modal` | 50 | Modais, dialogs |
| `z-toast` | 60 | Notificações, toasts |
| `z-tooltip` | 70 | Tooltips |

---

## 8. Animações e Transições

### Durações

| Token | Valor | Uso |
|---|---|---|
| `duration-fast` | 150ms | Hover de cores, opacidade |
| `duration-base` | 200ms | Microinterações padrão |
| `duration-slow` | 300ms | Expansões, modais |
| `duration-enter` | 400ms | Animações de entrada de página |

### Easings

| Token | Valor | Uso |
|---|---|---|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transições gerais |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Saída de elementos |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrada de elementos |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Efeitos de bounce |

### Regras
- ✅ Sempre use `transform` e `opacity` para animar
- ❌ Nunca anime `width`, `height`, `top`, `left` diretamente
- ✅ Respeite `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Componentes — Padrões de Estilo

### Botões

| Variante | Aparência | Uso |
|---|---|---|
| Primary | Fundo primário, texto branco | Ação principal por página |
| Secondary | Borda primária, fundo transparente | Ações secundárias |
| Ghost | Sem borda, fundo no hover | Ações terciárias, links |
| Destructive | Fundo vermelho/erro | Excluir, remover |
| Disabled | Opacidade 50%, `cursor-not-allowed` | Estado inativo |
| Loading | Spinner + texto, `disabled` | Durante operação assíncrona |

> Tamanho mínimo: **44×44px** (alvo de toque)
> Todos com: `cursor-pointer`, `transition-colors`, `duration-200`

### Inputs

- Border: `--color-border` no padrão, `--color-primary` no foco
- `border-radius`: `rounded-md` (8px)
- Padding: `12px 16px`
- Label sempre visível (não use apenas placeholder)
- Mensagem de erro abaixo do campo, próxima ao problema

### Cards

- Background: `--color-surface`
- Border: `1px solid var(--color-border)`
- Border-radius: `rounded-lg` (12px)
- Padding: `space-5` (20px) ou `space-6` (24px)
- Hover: `shadow-md` + `border-color: primary` (transição 200ms)
- Clicável: adicionar `cursor-pointer`

---

## 10. Breakpoints Responsivos

| Breakpoint | Largura | Dispositivo alvo |
|---|---|---|
| `xs` | 375px | iPhone SE, smartphones pequenos |
| `sm` | 640px | Smartphones grandes |
| `md` | 768px | Tablets retrato |
| `lg` | 1024px | Tablets paisagem, laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Monitores grandes |

> **Mobile-first**: Comece pelo menor breakpoint e expanda com `min-width`.

---

## 11. Ícones

| Campo | Valor |
|---|---|
| **Biblioteca** | Heroicons / Lucide / Phosphor / Tabler |
| **Tamanho padrão** | 20px (inline) / 24px (standalone) |
| **ViewBox** | `0 0 24 24` |
| **Stroke width** | 1.5px |

> ❌ **Nunca use emojis como ícones de UI**
> ✅ Sempre use SVG do mesmo conjunto de ícones

---

## 12. Acessibilidade — Padrões

| Regra | Implementação |
|---|---|
| Contraste de texto | Mínimo 4,5:1 (texto normal), 3:1 (texto grande) |
| Estados de foco | `outline: 2px solid var(--color-primary); outline-offset: 2px` |
| Alt em imagens | Sempre descritivo para imagens significativas; `alt=""` para decorativas |
| Labels | `<label for="id">` vinculado a cada input |
| ARIA | `aria-label` em botões de apenas ícone; `role` onde necessário |
| Toque | Mínimo 44×44px em todos os elementos interativos |

---

## 13. Changelog do Guia de Estilo

| Versão | Data | Mudança | Responsável |
|---|---|---|---|
| v1.0 | | Criação inicial | |
| | | | |

---

_Documento mantido por: [NOME/EQUIPE]_
_Baseado em: ui-ux-pro-max skill_
