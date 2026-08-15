# PRD — Painel de Estatísticas de Vendas

## 1. Visão Geral

O **Painel de Estatísticas** (`/admin/estatisticas`) é uma nova rota dentro da área `admin` do EventLogistics que consolida os indicadores de vendas de **tickets validados** em um único painel visual.

O painel é exclusivo do perfil `admin` e complementa o `CentralDashboardView` (estoque em tempo real), focando em **dados analíticos pós-venda**: faturamento, produtos destaque e performance por barraca.

---

## 2. Contexto da Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite 6 + TypeScript |
| Estilização | Tailwind CSS v4 (`@import "tailwindcss"` — sem `tailwind.config.js`) |
| Ícones | `lucide-react` |
| Animações | `motion` (Framer Motion v12) |
| Roteamento | `react-router-dom` v7 |
| Dados em tempo real | Socket.IO Client — hook `useAppData` |
| HTTP | `api.getState()` via `src/api/client.ts` |
| Backend | Node.js + Express + TypeScript + Socket.IO |
| Banco | PostgreSQL 16 — pool `pg`, SQL explícito |
| Auth | JWT via `Authorization: Bearer <token>`, role `admin` |

> **Não há Next.js, shadcn/ui, Recharts, SWR ou RSC neste projeto.**
> Qualquer gráfico ou visualização deve ser implementado com CSS/SVG puro ou uma lib compatível com Vite sem SSR.

---

## 3. Integração de Dados

### 3.1 Fonte de dados existente

O hook `useAppData` (`src/api/useAppData.ts`) já provê o estado global via `GET /api/state` + WebSocket `state:update`. Ele retorna:

```ts
{
  products: Product[],  // src/types.ts
  stalls:   Stall[],
  tickets:  Ticket[]   // status: 'pending' | 'validated' | 'reverted'
}
```

Os tipos estão definidos em `src/types.ts`:

```ts
interface Ticket {
  id: string;
  code: string;
  items: TicketItem[];
  total: number;
  time: string;
  timestamp: string;   // ISO string vindo do backend
  status: 'pending' | 'validated' | 'reverted';
}

interface TicketItem {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}
```

### 3.2 Filtragem para estatísticas

O componente de página deve filtrar apenas tickets `validated` e derivar as métricas agregadas no frontend — **sem endpoint novo no backend nesta versão**:

```ts
const validatedTickets = tickets.filter(t => t.status === 'validated');
```

As funções de agregação ficam em `src/admin/estatisticas/stats.ts` (novo arquivo) e recebem `Ticket[]` como parâmetro — nunca dependem de estado global de módulo.

### 3.3 Métricas a calcular

| Função | Retorno |
| --- | --- |
| `calcTotals(tickets)` | `{ revenue, units, activeStalls, topProduct }` |
| `calcRevenueByStall(tickets, stalls)` | `{ stallName, revenue }[]` ordenado desc |
| `calcTopProductsGeneral(tickets)` | `{ productName, units }[]` top-10 desc |
| `calcTopByStall(tickets, stalls)` | `{ stallName, items: { productName, units }[] }[]` |

### 3.4 Atualização em tempo real

`useAppData` mantém os dados sincronizados via WebSocket. O painel deve:

1. Consumir `useAppData()` — **não** criar novo `fetch` ou socket próprio.
2. Recalcular as métricas com `useMemo` sempre que `tickets` mudar.
3. Exibir estado de loading enquanto `loading === true`.
4. Exibir mensagem de erro se `error !== null`.

```tsx
const { tickets, stalls, loading, error } = useAppData();
const totals = useMemo(() => calcTotals(tickets), [tickets]);
```

---

## 4. Arquivos

### 4.1 Novos arquivos

| Arquivo | Papel |
| --- | --- |
| `src/admin/estatisticas/EstatisticasPage.tsx` | Componente de página — consume `useAppData`, deriva métricas, monta layout |
| `src/admin/estatisticas/stats.ts` | Funções puras de agregação (sem efeitos colaterais) |
| `src/admin/estatisticas/StatCards.tsx` | Cards de resumo (faturamento, unidades, barracas, destaque) |
| `src/admin/estatisticas/RevenueByStall.tsx` | Gráfico de barras por barraca (CSS/SVG) |
| `src/admin/estatisticas/TopProductsGeneral.tsx` | Gráfico de pizza/rosca (SVG) |
| `src/admin/estatisticas/ProductsByStall.tsx` | Barras horizontais por barraca |

### 4.2 Arquivos a modificar

| Arquivo | Alteração |
| --- | --- |
| `src/admin/AdminApp.tsx` | Adicionar rota `estatisticas` apontando para `EstatisticasPage` |
| Navbar do admin | Adicionar link "Estatísticas" com ícone `BarChart3` (lucide-react) |

---

## 5. Roteamento

O frontend usa `react-router-dom` v7 com rotas aninhadas. A página deve ser adicionada dentro de `AdminApp.tsx`:

```tsx
<Route path="estatisticas" element={<EstatisticasPage />} />
```

- **URL**: `http://localhost:3000/admin/estatisticas`
- **Proteção**: herdada do `<ProtectedRoute allowedRoles={['admin']} />` já aplicado na rota pai `/admin/*`

---

## 6. Design System

O projeto usa **Tailwind CSS v4** com o tema definido em `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

### 6.1 Regras de estilização

- **Apenas classes Tailwind v4** — utilitários como `bg-gray-900`, `text-white`, `rounded-xl`, `gap-4`, etc.
- Sem tokens OKLCH customizados, sem `var(--chart-N)`.
- Tipografia: `font-sans` (Inter), conforme o tema existente.
- Ícones: `lucide-react` (já instalado e usado no projeto).
- Animações de entrada: `motion` (Framer Motion v12) — usar `motion.div` com `initial/animate/transition`.

### 6.2 Consistência com o painel admin existente

Observe `CentralDashboardView.tsx` e `CustomerTicketView.tsx` para manter consistência visual:
- Paleta de cores (dark mode — ex.: `bg-gray-900`, `bg-gray-800`, `bg-gray-700`)
- Cards com `rounded-xl`, borda sutil e sombra
- Hierarquia tipográfica: `text-xl font-bold`, `text-sm text-gray-400`
- Botões e badges com padrão existente

### 6.3 Gráficos sem libs externas

Implementar com SVG ou CSS puro:

```tsx
{/* Barra de progresso proporcional */}
<div className="h-2 rounded-full bg-gray-700">
  <div
    className="h-2 rounded-full bg-blue-500 transition-all"
    style={{ width: `${(value / max) * 100}%` }}
  />
</div>
```

Para gráfico de pizza: usar `stroke-dasharray` / `stroke-dashoffset` em `<circle>` SVG.

---

## 7. Variáveis de Ambiente

Nenhuma variável nova é necessária. O frontend já aponta para o backend via proxy Vite (`vite.config.ts`):

```ts
proxy: { '/api': 'http://localhost:4000' }
```

Backend rodando em `http://localhost:4000` (porta configurada em `backend/.env`).
Frontend em `http://localhost:3000` (configurado em `package.json`: `vite --port=3000`).

---

## 8. Indicadores (Cards de Resumo)

| Card | Dado | Cálculo |
| --- | --- | --- |
| Faturamento validado | `R$ X.XXX,XX` | `sum(ticket.total)` dos tickets `validated` |
| Unidades entregues | `X unid.` | `sum(item.quantity)` em todos os tickets validados |
| Barracas ativas | `X barracas` | distinct `stallId` dos produtos vendidos em tickets validados |
| Produto destaque | nome do produto | produto com maior `sum(quantity)` entre todos os tickets validados |

---

## 9. Checklist de Implementação

- [ ] Criar `src/admin/estatisticas/stats.ts` com as 4 funções de agregação.
- [ ] Criar `StatCards.tsx` com 4 cards de resumo e animação `motion`.
- [ ] Criar `RevenueByStall.tsx` com barras verticais SVG/CSS por barraca.
- [ ] Criar `TopProductsGeneral.tsx` com gráfico de pizza SVG (top-10 produtos).
- [ ] Criar `ProductsByStall.tsx` com barras horizontais, um card por barraca.
- [ ] Criar `EstatisticasPage.tsx` compondo todos os componentes acima.
- [ ] Adicionar rota `estatisticas` em `AdminApp.tsx`.
- [ ] Adicionar link "Estatísticas" com ícone `BarChart3` na navbar do admin.
- [ ] Garantir estado vazio elegante quando não há tickets validados.
- [ ] Testar responsividade mobile-first com prefixos `md:` e `lg:`.

---

## 10. Não-Objetivos (Fora de Escopo)

- Endpoint novo no backend para estatísticas (agregação fica no frontend nesta versão).
- Filtros por data/período (versão futura).
- Exportação CSV/PDF.
- Libs de gráfico externas (Recharts, Chart.js, D3) — usar SVG/CSS puro.
- Painel de auditoria (`audit_logs`) — escopo separado.
- Suporte a múltiplos eventos — fora do escopo do projeto atual (ver `prd-geral.md`).