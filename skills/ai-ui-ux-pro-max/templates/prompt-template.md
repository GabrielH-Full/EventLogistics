# 🎨 UI/UX Pro Max — Prompt Template

Use este template ao solicitar trabalho de UI/UX para uma IA (Claude, Gemini, etc.).
Preencha os campos entre `[ ]` e remova as opções que não se aplicam.

---

## ✅ Template Completo

```
Crie [TIPO DE ENTREGÁVEL] para [NOME DO PROJETO/PRODUTO].

## Contexto do Projeto
- **Tipo de produto**: [SaaS / E-commerce / Landing page / Dashboard / App móvel / Painel admin]
- **Setor**: [Saúde / Fintech / Beleza/Bem-estar / Educação / Jogos / Varejo / Tecnologia / Serviços]
- **Stack**: [html-tailwind / React / Next.js / Vue / Svelte / SwiftUI / React Native / Flutter / shadcn/ui]

## Estilo Visual
- **Estilo principal**: [Glassmorphism / Claymorphism / Minimalismo / Brutalismo / Neumorphism / Bento Grid / Skeuomorphism / Design Flat]
- **Mood/Tom**: [Elegante / Divertido / Profissional / Moderno / Luxuoso / Acolhedor / Futurista / Limpo]
- **Modo**: [Escuro / Claro / Ambos (com toggle)]
- **Paleta de cores**: [Defina aqui OU deixe a IA recomendar com base no setor]

## Tipografia
- **Fontes**: [Defina aqui OU deixe a IA recomendar]
  - Título: [Ex: Playfair Display / Inter / Clash Display]
  - Corpo: [Ex: Inter / DM Sans / Lato]
- **Tamanho base**: 16px (obrigatório para mobile)

## Componentes / Seções Necessários
- [ ] Hero / Banner principal
- [ ] Navbar (fixa / flutuante / simples)
- [ ] Cards (produto / serviço / depoimento)
- [ ] Formulário (contato / login / cadastro)
- [ ] CTA (Call to Action)
- [ ] Footer
- [ ] Tabela de preços / Pricing
- [ ] Seção de gráficos / Dados
- [ ] Modal / Dialog
- [ ] Sidebar
- [ ] [Outro: especifique]

## Requisitos de UX (todos obrigatórios)
- Responsivo: 375px, 768px, 1024px, 1440px
- Acessibilidade: contraste mínimo 4,5:1, estados de foco visíveis, labels em formulários
- Sem emojis como ícones (use Heroicons ou Lucide SVG)
- cursor-pointer em todos os elementos clicáveis
- Transições suaves: 150–300ms
- Sem rolagem horizontal em mobile
- Respeitar prefers-reduced-motion

## Animações e Interações
- [ ] Hover com feedback visual (cor / sombra / borda)
- [ ] Loading states (skeleton / spinner)
- [ ] Scroll animations (reveal on scroll)
- [ ] Microinterações em botões
- [ ] Transições de página
- [Outro: especifique]

## Gráficos / Dados (se aplicável)
- Tipo de dado: [Tendência / Comparação / Distribuição / Fluxo / Relacionamento]
- Biblioteca preferida: [Chart.js / Recharts / D3.js / ApexCharts / Deixe a IA escolher]

## Referências Visuais
- Sites/apps de inspiração: [Ex: linear.app, vercel.com, stripe.com]
- Cores de referência: [Ex: #6366F1, #0EA5E9]
- [Ou descreva livremente o que te inspira]

## Restrições e Preferências
- [Ex: Não use imagens de stock]
- [Ex: Evite animações pesadas por questão de performance]
- [Ex: Precisa funcionar offline]

## Entregável esperado
- [ ] Código completo (HTML/CSS/JS ou componente)
- [ ] Apenas estrutura/boilerplate
- [ ] Sistema de design (tokens, variáveis CSS)
- [ ] Revisão e sugestões de melhoria do código existente
- [ ] Checklist de problemas encontrados
```

---

## 🚀 Templates Rápidos por Caso de Uso

### Dashboard Administrativo

```
Crie um dashboard administrativo para [PRODUTO/SETOR].

- Stack: [React / html-tailwind]
- Estilo: Minimalismo + Modo Escuro
- Layout: Sidebar fixa + conteúdo principal
- Componentes: Cards de métricas (4), Gráfico de linha (tendência), Tabela de dados, Navbar com avatar
- Paleta: slate-900 de fundo, índigo como acento
- Responsivo: collapsable sidebar em mobile
- Gráficos: Recharts (React) / Chart.js (vanilla)
```

### App Móvel (React Native / Flutter)

```
Crie a UI de [NOME DA TELA] para um app móvel de [DESCRIÇÃO].

- Stack: [React Native / Flutter]
- Estilo: [Claymorphism / Minimalismo / Modo Escuro]
- Tamanho alvo de toque: mínimo 44x44dp em todos os elementos interativos
- Componentes: [liste os componentes]
- Tipografia: [fonte] — mínimo 16sp para texto do corpo
- Acessibilidade: accessibilityLabel em todos os botões, VoiceOver/TalkBack compatível
```

---

## 📋 Checklist Pós-Entrega (para revisar o código recebido)

Após receber o código da IA, revise com este checklist:

### Visual
- [ ] Sem emojis usados como ícones
- [ ] Todos os ícones do mesmo conjunto (Heroicons/Lucide)
- [ ] Estados de hover não deslocam o layout
- [ ] Cores do tema consistentes em todo o código

### Interação
- [ ] `cursor-pointer` em todos os elementos clicáveis
- [ ] Hover com feedback visual (cor, sombra, borda)
- [ ] Transições de 150–300ms
- [ ] Estados de foco visíveis (para teclado)

### Modo Claro/Escuro
- [ ] Contraste de texto adequado (mínimo 4,5:1)
- [ ] Elementos glassmorphism visíveis em modo claro (`bg-white/80`, não `bg-white/10`)
- [ ] Bordas visíveis (`border-gray-200` em modo claro)

### Layout
- [ ] Responsivo em 375px, 768px, 1024px, 1440px
- [ ] Sem rolagem horizontal em mobile
- [ ] Conteúdo não escondido atrás de navbars fixas
- [ ] `max-w` consistente nos containers

### Acessibilidade
- [ ] Todas as imagens com `alt`
- [ ] Campos de formulário com `<label>`
- [ ] Cor não é o único indicador de estado
- [ ] `prefers-reduced-motion` respeitado

---

## 💡 Dicas de Uso

1. **Seja específico** — "landing page para SaaS de gestão de eventos no setor corporativo" gera resultados muito melhores que "landing page"
2. **Mencione referências visuais** — sites como linear.app, vercel.com ou stripe.com ajudam a calibrar o nível de qualidade
3. **Itere** — peça variações de cor ou estilo se a primeira versão não agradar
4. **Use o checklist** — sempre revise o código recebido com o checklist pós-entrega
5. **Peça explicações** — adicione "e explique as escolhas de design" ao final do prompt para aprender com as decisões
