import { Ticket, Product, Stall } from '../../types';

export const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export interface AggregatedProductSale {
  id: string;
  name: string;
  category: string;
  stallId: string;
  stallName: string;
  price: number;
  qty: number;
  revenue: number;
}

export interface StallRevenue {
  stallId: string;
  stallName: string;
  shortName: string;
  revenue: number;
  qty: number;
  color: string;
}

export interface StallProductsGroup {
  stallId: string;
  stallName: string;
  color: string;
  products: AggregatedProductSale[];
}

const PALETTE = [
  '#0066ff', // Blue
  '#10b981', // Emerald / Green
  '#f59e0b', // Amber / Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

/** Obtém todas as vendas de itens de tickets validados agregados por produto. */
export function getValidatedSales(
  tickets: Ticket[],
  products: Product[],
  stalls: Stall[]
): AggregatedProductSale[] {
  const validatedTickets = tickets.filter(t => t.status === 'validated');
  
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  const stallMap = new Map<string, Stall>();
  stalls.forEach(s => stallMap.set(s.id, s));

  const salesMap = new Map<string, AggregatedProductSale>();

  for (const ticket of validatedTickets) {
    for (const item of ticket.items) {
      const prod = productMap.get(item.productId);
      const stallId = prod?.stallId || 'unknown';
      const stall = stallMap.get(stallId);
      const stallName = stall ? stall.name : 'Barraca';

      const existing = salesMap.get(item.productId);
      const itemPrice = Number(item.price) || (prod ? Number(prod.price) : 0);
      const itemQty = Number(item.quantity) || 0;
      const itemRevenue = itemPrice * itemQty;

      if (existing) {
        existing.qty += itemQty;
        existing.revenue += itemRevenue;
      } else {
        salesMap.set(item.productId, {
          id: item.productId,
          name: item.name || prod?.name || 'Produto',
          category: item.category || prod?.category || 'Geral',
          stallId,
          stallName,
          price: itemPrice,
          qty: itemQty,
          revenue: itemRevenue,
        });
      }
    }
  }

  return Array.from(salesMap.values());
}

/** Calcula métricas de resumo gerais. */
export function calcTotals(
  tickets: Ticket[],
  products: Product[],
  stalls: Stall[]
) {
  const sales = getValidatedSales(tickets, products, stalls);

  const revenue = sales.reduce((acc, p) => acc + p.revenue, 0);
  const units = sales.reduce((acc, p) => acc + p.qty, 0);

  // Barracas distintas com pelo menos 1 venda validada
  const activeStallIds = new Set(sales.filter(s => s.qty > 0).map(s => s.stallId));

  const sortedSales = [...sales].sort((a, b) => b.qty - a.qty);
  const topProduct = sortedSales[0] || {
    name: 'Nenhum item',
    qty: 0,
    revenue: 0,
  };

  return {
    revenue,
    units,
    activeStalls: activeStallIds.size || stalls.length,
    topProduct,
  };
}

/** Calcula faturamento por barraca. */
export function calcRevenueByStall(
  tickets: Ticket[],
  products: Product[],
  stalls: Stall[]
): StallRevenue[] {
  const sales = getValidatedSales(tickets, products, stalls);

  const stallStatsMap = new Map<string, { revenue: number; qty: number }>();
  for (const s of sales) {
    const cur = stallStatsMap.get(s.stallId) || { revenue: 0, qty: 0 };
    cur.revenue += s.revenue;
    cur.qty += s.qty;
    stallStatsMap.set(s.stallId, cur);
  }

  return stalls.map((stall, idx) => {
    const stats = stallStatsMap.get(stall.id) || { revenue: 0, qty: 0 };
    const shortName = stall.name
      .replace('Barraca ', '')
      .replace('das ', '')
      .replace('do ', '')
      .replace('de ', '');

    return {
      stallId: stall.id,
      stallName: stall.name,
      shortName,
      revenue: stats.revenue,
      qty: stats.qty,
      color: PALETTE[idx % PALETTE.length],
    };
  });
}

/** Produtos mais vendidos geral (Top 6). */
export function calcTopProductsGeneral(
  tickets: Ticket[],
  products: Product[],
  stalls: Stall[]
) {
  const sales = getValidatedSales(tickets, products, stalls);
  const sorted = [...sales].sort((a, b) => b.qty - a.qty);

  return sorted.slice(0, 6).map((p, idx) => ({
    ...p,
    color: PALETTE[idx % PALETTE.length],
  }));
}

/** Produtos mais vendidos agrupados por barraca. */
export function calcTopProductsByStall(
  tickets: Ticket[],
  products: Product[],
  stalls: Stall[]
): StallProductsGroup[] {
  const sales = getValidatedSales(tickets, products, stalls);

  return stalls.map((stall, idx) => {
    const stallProducts = sales
      .filter(p => p.stallId === stall.id)
      .sort((a, b) => b.qty - a.qty);

    return {
      stallId: stall.id,
      stallName: stall.name,
      color: PALETTE[idx % PALETTE.length],
      products: stallProducts,
    };
  });
}
