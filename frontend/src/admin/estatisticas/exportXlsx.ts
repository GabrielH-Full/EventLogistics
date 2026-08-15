import * as XLSX from 'xlsx';
import {
  brl,
  calcRevenueByStall,
  calcTopProductsByStall,
  calcTopProductsGeneral,
  calcTotals,
} from './stats';
import { Ticket, Product, Stall } from '../../types';

// Gera e baixa um relatório .xlsx com 4 abas a partir dos dados de tickets validados.
export function exportStatsToXlsx(
  tickets: Ticket[],
  products: Product[],
  stalls: Stall[]
) {
  const wb = XLSX.utils.book_new();

  // --- Aba 1: Resumo ---
  const t = calcTotals(tickets, products, stalls);
  const resumo = [
    ['Relatório de Estatísticas — Tickets Validados'],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    [],
    ['Indicador', 'Valor'],
    ['Faturamento validado', brl(t.revenue)],
    ['Unidades entregues', t.units],
    ['Barracas ativas', t.activeStalls],
    ['Produto destaque', `${t.topProduct.name} (${t.topProduct.qty} un.)`],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo['!cols'] = [{ wch: 24 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // --- Aba 2: Faturamento por Barraca ---
  const fat = calcRevenueByStall(tickets, products, stalls);
  const wsFat = XLSX.utils.json_to_sheet(
    fat.map(s => ({
      Barraca: s.stallName,
      'Unidades validadas': s.qty,
      'Faturamento (R$)': Number(s.revenue.toFixed(2)),
    }))
  );
  wsFat['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsFat, 'Faturamento por Barraca');

  // --- Aba 3: Produtos (Geral) ---
  const geral = calcTopProductsGeneral(tickets, products, stalls);
  const wsGeral = XLSX.utils.json_to_sheet(
    geral.map((p, i) => ({
      '#': i + 1,
      Produto: p.name,
      Barraca: p.stallName,
      'Preço unit. (R$)': Number(p.price.toFixed(2)),
      'Qtd validada': p.qty,
      'Faturamento (R$)': Number(p.revenue.toFixed(2)),
    }))
  );
  wsGeral['!cols'] = [
    { wch: 4 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGeral, 'Produtos (Geral)');

  // --- Aba 4: Produtos por Barraca ---
  const porBarraca = calcTopProductsByStall(tickets, products, stalls);
  const linhas: Record<string, string | number>[] = [];
  for (const s of porBarraca) {
    for (const p of s.products) {
      linhas.push({
        Barraca: s.stallName,
        Produto: p.name,
        'Preço unit. (R$)': Number(p.price.toFixed(2)),
        'Qtd validada': p.qty,
        'Faturamento (R$)': Number(p.revenue.toFixed(2)),
      });
    }
  }
  const wsBarraca = XLSX.utils.json_to_sheet(linhas);
  wsBarraca['!cols'] = [
    { wch: 26 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBarraca, 'Produtos por Barraca');

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `estatisticas-evento-${stamp}.xlsx`);
}
