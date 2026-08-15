import React, { useMemo } from 'react';
import { useAppData } from '../../api/useAppData';
import { StatCards } from './StatCards';
import { RevenueByStall } from './RevenueByStall';
import { TopProductsGeneral } from './TopProductsGeneral';
import { ProductsByStall } from './ProductsByStall';
import { ExportButton } from './ExportButton';
import {
  calcTotals,
  calcRevenueByStall,
  calcTopProductsGeneral,
  calcTopProductsByStall,
} from './stats';
import { BarChart3, RefreshCw } from 'lucide-react';

export default function EstatisticasPage() {
  const { tickets, products, stalls, loading, error, refresh } = useAppData();

  const totals = useMemo(
    () => calcTotals(tickets, products, stalls),
    [tickets, products, stalls]
  );

  const revenueData = useMemo(
    () => calcRevenueByStall(tickets, products, stalls),
    [tickets, products, stalls]
  );

  const topProducts = useMemo(
    () => calcTopProductsGeneral(tickets, products, stalls),
    [tickets, products, stalls]
  );

  const productsByStallData = useMemo(
    () => calcTopProductsByStall(tickets, products, stalls),
    [tickets, products, stalls]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 font-semibold text-sm">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0066ff] mr-2" />
        Carregando estatísticas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl max-w-md mx-auto text-sm font-semibold">
          Erro ao carregar dados: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-[#191b24] tracking-tight flex items-center gap-3">
              <span>Estatísticas de Vendas</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
              Faturamento de tickets validados e ranking de produtos por barraca em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={refresh}
              className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0066ff]" />
              <span>Atualizar</span>
            </button>

            <ExportButton tickets={tickets} products={products} stalls={stalls} />
          </div>
        </header>

        {/* Content Stack */}
        <div className="flex flex-col gap-6">
          {/* Stat Cards */}
          <StatCards
            revenue={totals.revenue}
            units={totals.units}
            activeStalls={totals.activeStalls}
            topProduct={totals.topProduct}
          />

          {/* Grid 2D: Faturamento por Barraca & Produtos mais vendidos geral */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueByStall data={revenueData} totalRevenue={totals.revenue} />
            <TopProductsGeneral products={topProducts} totalUnits={totals.units} />
          </div>

          {/* Ranking Mais Vendidos por Barraca */}
          <section className="flex flex-col gap-4 mt-2">
            <div>
              <h2 className="text-xl font-black text-[#191b24] tracking-tight">
                Mais Vendidos por Barraca
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Ranking de produtos validados em cada ponto de venda.
              </p>
            </div>
            <ProductsByStall groups={productsByStallData} />
          </section>
        </div>
      </main>
    </div>
  );
}
