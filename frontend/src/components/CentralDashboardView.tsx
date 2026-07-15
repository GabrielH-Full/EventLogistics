import React, { useState } from 'react';
import { Product, Stall, Ticket } from '../types';
import { 
  LayoutDashboard, 
  Bell, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  UtensilsCrossed,
  Candy,
  Flame, 
  TrendingUp, 
  Ticket as TicketIcon 
} from 'lucide-react';
import { IMAGES } from '../data';

interface CentralDashboardViewProps {
  products: Product[];
  tickets: Ticket[];
  stalls: Stall[];
  onSelectStall: (stallId: string) => void;
}

type GlobalFilter = 'all' | 'alerts' | 'out_of_stock';

export default function CentralDashboardView({
  products,
  tickets,
  stalls,
  onSelectStall
}: CentralDashboardViewProps) {
  const [filter, setFilter] = useState<GlobalFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Compute stats dynamically based on products state
  const totalTicketsSold = tickets.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const activeAlertsCount = products.filter(p => p.stock > 0 && p.stock <= 15).length;

  // Filter products/stalls depending on the active tab filter
  const renderStallProducts = (stallId: string) => {
    let stallProducts = products.filter(p => p.stallId === stallId);

    if (filter === 'alerts') {
      stallProducts = stallProducts.filter(p => p.stock <= 15);
    } else if (filter === 'out_of_stock') {
      stallProducts = stallProducts.filter(p => p.stock === 0);
    }

    return stallProducts;
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#faf8ff]">
      {/* Top App Bar */}
      <header className="bg-white shadow-sm flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-[#0050cb] p-2 rounded-lg text-white">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-[#0050cb] tracking-tight">Logistica de Eventos</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-[#424656]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-blue-100 p-0.5 overflow-hidden shadow-sm">
            <img 
              src={IMAGES.profile} 
              alt="Manager Profile" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-6">
        {/* Welcome & Quick Metrics Title */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <p className="text-xs font-extrabold text-[#0050cb] uppercase tracking-widest mb-1">
                Visão Geral do Evento
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-[#191b24] tracking-tight">
                Caixa Central - Dashboard
              </h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilterModal(!showFilterModal)}
                className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2.5 rounded-xl font-bold text-sm text-[#424656] hover:bg-gray-50 active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#0050cb]" />
                <span>Filtros</span>
              </button>
            </div>
          </div>

          {/* Bento Grid Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Tickets Sold metric */}
            <div className="bg-[#0066ff] p-5 rounded-2xl text-white shadow-md shadow-blue-500/10 flex flex-col justify-between min-h-[140px] transition-all hover:translate-y-[-2px]">
              <div className="flex justify-between items-start">
                <TicketIcon className="w-6 h-6 opacity-90" />
                <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% hoje</span>
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">Tickets Vendidos</p>
                <p className="text-4xl md:text-5xl font-black leading-none mt-1 tracking-tight">
                  {totalTicketsSold}
                </p>
              </div>
            </div>

            {/* Out of Stock metric */}
            <div className="bg-white border-2 border-[#ffdad6] p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[140px] transition-all hover:translate-y-[-2px]">
              <div className="flex justify-between items-start">
                <XCircle className="w-6 h-6 text-[#ba1a1a]" />
                <span className="bg-[#ffdad6] text-[#93000a] px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                  Crítico
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Itens Esgotados</p>
                <p className="text-4xl md:text-5xl font-black leading-none mt-1 text-[#ba1a1a] tracking-tight">
                  {outOfStockCount}
                </p>
              </div>
            </div>

            {/* Active Alerts metric */}
            <div className="bg-[#ffb95f]/15 border border-[#ffb95f]/40 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[140px] transition-all hover:translate-y-[-2px]">
              <div className="flex justify-between items-start">
                <AlertTriangle className="w-6 h-6 text-[#a06500]" />
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-yellow-600 border border-amber-200"></div>
                  <div className="w-5 h-5 rounded-full bg-yellow-500 border border-amber-200 opacity-60"></div>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-amber-900/80 uppercase tracking-widest">Alertas Ativos</p>
                <p className="text-4xl md:text-5xl font-black leading-none mt-1 text-[#a06500] tracking-tight">
                  {activeAlertsCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap active:scale-95 transition-all ${
              filter === 'all'
                ? 'bg-[#0050cb] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Ver Todos
          </button>
          <button
            onClick={() => setFilter('alerts')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap active:scale-95 transition-all ${
              filter === 'alerts'
                ? 'bg-[#0050cb] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Apenas Alertas {activeAlertsCount > 0 && `(${activeAlertsCount})`}
          </button>
          <button
            onClick={() => setFilter('out_of_stock')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap active:scale-95 transition-all ${
              filter === 'out_of_stock'
                ? 'bg-[#0050cb] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Esgotados {outOfStockCount > 0 && `(${outOfStockCount})`}
          </button>
        </div>

        {/* Filter Indicator Banner */}
        {filter !== 'all' && (
          <div className="mb-4 bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl text-xs text-[#0050cb] font-semibold flex justify-between items-center">
            <span>
              Filtrado por: {filter === 'alerts' ? 'Barracas com baixo estoque' : 'Produtos esgotados'}
            </span>
            <button onClick={() => setFilter('all')} className="underline font-bold text-[10px] uppercase tracking-wider">
              Limpar Filtro
            </button>
          </div>
        )}

        {/* Stall Overview List - gerado dinamicamente a partir de todas as barracas cadastradas */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="dashboard-stall-grid">
          {stalls.map((stall) => {
            const stallProducts = renderStallProducts(stall.id);

            const STALL_ICONS: Record<Stall['icon'], typeof Flame> = {
              bakery_dining: UtensilsCrossed,
              outdoor_grill: Flame,
              local_candy: Candy
            };
            const StallIcon = STALL_ICONS[stall.icon];


            return (
              <div key={stall.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => onSelectStall(stall.id)}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-xl text-[#0050cb]">
                      <StallIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-base text-[#0050cb]">{stall.name}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="p-5 space-y-4 flex-grow">
                  {stallProducts.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-medium">
                      Nenhum produto atende ao critério de filtro.
                    </div>
                  ) : (
                    stallProducts.map((product) => {
                      const percent = Math.round((product.stock / product.maxStock) * 100);
                      const isOutOfStock = product.stock === 0;
                      const isLowStock = product.stock > 0 && product.stock <= 15;

                      return (
                        <div key={product.id} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-[#191b24]">{product.name}</span>
                            {isOutOfStock ? (
                              <span className="bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase">
                                Bloqueado - Esgotado
                              </span>
                            ) : isLowStock ? (
                              <span className="bg-[#ffddb8] text-[#2a1700] px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase">
                                Baixo Estoque
                              </span>
                            ) : (
                              <span className="bg-[#6bff8f]/30 text-[#007432] px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase">
                                Disponível
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-grow bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ${
                                  isOutOfStock
                                    ? 'bg-[#ba1a1a]'
                                    : isLowStock
                                    ? 'bg-[#7f4f00]'
                                    : 'bg-[#006e2f]'
                                }`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <span className={`font-bold text-xs min-w-[3.5rem] text-right ${
                              isOutOfStock ? 'text-[#ba1a1a]' : isLowStock ? 'text-[#7f4f00]' : 'text-[#006e2f]'
                            }`}>
                              {product.stock} rest.
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* Visual Asset Placeholder Card */}
          <div className="relative bg-[#2e303a] rounded-2xl overflow-hidden min-h-[220px] md:min-h-[260px] group transition-all duration-300 hover:scale-[1.01] shadow-md border border-gray-800">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-55 group-hover:opacity-40 transition-opacity duration-500" 
              referrerPolicy="no-referrer"
              style={{ backgroundImage: `url('${IMAGES.festival}')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#2e303a] via-[#2e303a]/20 to-transparent"></div>
            
            <div className="relative z-10 p-6 h-full flex flex-col justify-end">
              <span className="inline-block bg-[#0066ff] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 w-max shadow-sm">
                Ao Vivo
              </span>
              <p className="text-xs font-black text-blue-200 uppercase tracking-widest mb-1">
                Relatório em Tempo Real
              </p>
              <h4 className="text-xl md:text-2xl font-black text-white leading-tight">
                Monitoramento de Fluxo das Barracas
              </h4>
            </div>
          </div>
        </section>
      </main>

      {/* Quick Filter Modal / Panel Backdrop */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
            <h3 className="font-extrabold text-lg text-[#191b24] mb-3">Configurar Filtros</h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              Ajuste as prioridades de exibição das barracas e estoque.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => { setFilter('all'); setShowFilterModal(false); }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 font-bold text-xs"
              >
                <span>Mostrar todos os itens</span>
                <CheckCircle className={`w-4 h-4 ${filter === 'all' ? 'text-[#0050cb]' : 'text-gray-200'}`} />
              </button>
              <button
                onClick={() => { setFilter('alerts'); setShowFilterModal(false); }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 font-bold text-xs"
              >
                <span>Alerta de estoque crítico (≤ 15 un)</span>
                <CheckCircle className={`w-4 h-4 ${filter === 'alerts' ? 'text-amber-500' : 'text-gray-200'}`} />
              </button>
              <button
                onClick={() => { setFilter('out_of_stock'); setShowFilterModal(false); }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 font-bold text-xs"
              >
                <span>Itens esgotados (0 un)</span>
                <CheckCircle className={`w-4 h-4 ${filter === 'out_of_stock' ? 'text-red-500' : 'text-gray-200'}`} />
              </button>
            </div>

            <button
              onClick={() => setShowFilterModal(false)}
              className="mt-6 w-full py-3 bg-[#0050cb] text-white rounded-xl font-bold text-xs active:scale-95 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
