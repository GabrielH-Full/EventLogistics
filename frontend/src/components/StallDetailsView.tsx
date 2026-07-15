import React, { useState } from 'react';
import { Product, Stall, Ticket} from '../types';
import { 
  PlusCircle, 
  Percent, 
  TrendingUp, 
  AlertTriangle, 
  AlertOctagon, 
  Bell, 
  ArrowUpRight,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  RefreshCw,
  Clock,
  Candy
} from 'lucide-react';
import { div } from 'motion/react-m';

interface StallDetailsViewProps {
    stallId: string;
    stallName: string;
    productId: Product[];
    tickets: Ticket[];
    onBack: () => void;
}

export default function StallDetailsView({stallId, stallName, productId, tickets, onBack }: StallDetailsViewProps) {
    const [productionAnimation, setProductionAnimation] = useState<{[key: string]: boolean}>({});

     const stallProducts = productId.filter(p => p.stallId === stallId);
    const stallProductIds = new Set(stallProducts.map(p => p.id));

  // Compute stats dynamically for this specific stall
  // Tickets received is the sum of quantities of this stall's products in validated tickets
  const ticketsReceivedCount = tickets
    .filter(t => t.status === 'validated')
    .reduce((acc, t) => {
      const stallItemsCount = t.items
        .filter(item => stallProductIds.has(item.productId))
        .reduce((sum, item) => sum + item.quantity, 0);
      return acc + stallItemsCount;
    }, 0);

  // Average stock percentage across this stall's products
  const averageStockPercent = stallProducts.length === 0 ? 0 : Math.round(
    stallProducts.reduce((acc, p) => acc + (p.stock / p.maxStock), 0) / stallProducts.length * 100
  );

    // Produtos que pertencem apenas a essa barraca (dado real do backend, não mais um prefixo de string)
  return (
    <div className="flex flex-col min-h-screen bg-[#faf8ff] px-4 py-6 max-w-7xl mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-[#0050cb] mb-6 hover:underline w-max"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao painel geral
      </button>

      {/*<h2 className="text-2xl font-black text-[#191b24] mb-6">{stallName}</h2>*/}

       <header className="bg-white shadow-sm flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 border-b border-gray-100 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="bg-[#0050cb] p-2 rounded-lg text-white">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black text-[#0050cb] tracking-tight">{stallName}</h1>
              </div>
              <div className="flex items-center gap-4">
                
                {/* Operator circle indicator 
                <div className="w-9 h-9 rounded-full bg-[#0066ff] flex items-center justify-center border-2 border-blue-200 shadow-sm">
                  {/*<span className="text-xs font-extrabold text-white">OP</span>
                </div>*/}
              </div>
        </header>
         {/* Main Content Area */}
              <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
                {/* Stall Operator Quick Metrics */}
                <section className="grid grid-cols-2 gap-4 mb-8">
                  {/* Tickets Received card */}
                  <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[110px]">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Tickets Recebidos</span>
                      <TrendingUp className="w-4 h-4 text-[#0066ff]" />
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl md:text-4xl font-black text-[#191b24] leading-none tracking-tight">
                        {ticketsReceivedCount}
                      </p>
                      <p className="text-[10px] text-green-600 font-bold mt-1 uppercase flex items-center gap-1">
                        <span>• Ativos no caixa</span>
                      </p>
                    </div>
                  </div>
        
                  {/* Average Stock card */}
                  <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[110px]">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Estoque Médio</span>
                      <Percent className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="mt-2">
                      <p className={`text-3xl md:text-4xl font-black leading-none tracking-tight ${
                        averageStockPercent <= 30 ? 'text-[#ba1a1a]' : averageStockPercent <= 60 ? 'text-[#a06500]' : 'text-green-600'
                      }`}>
                        {averageStockPercent}%
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                        {averageStockPercent <= 30 ? '⚠️ Atenção crítica' : averageStockPercent <= 60 ? '⚡ Próximo da reposição' : '✅ Nível seguro'}
                      </p>
                    </div>
                  </div>
                </section>
        
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Gestão de Itens
                  </h2>
                </div>
        
                {/* List of Products Managed by this Stall */}
                <section className="space-y-4" id="operator-products-list">
                  {stallProducts.map((product) => {
                    const isOutOfStock = product.stock === 0;
                    const isLowStock = product.stock > 0 && product.stock <= 15;
                    const percent = Math.round((product.stock / product.maxStock) * 100);
                    const isAnimating = productionAnimation[product.id];
        
                    return (
                      <div
                        key={product.id}
                        id={`operator-card-${product.id}`}
                        className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 border transition-all ${
                          isOutOfStock
                            ? 'border-red-200 border-l-4 border-l-red-500'
                            : isLowStock
                            ? 'border-amber-200 border-l-4 border-l-amber-500 shadow-md'
                            : 'border-gray-100'
                        }`}
                      >
                        {/* Header Information for Item */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-[#191b24]">{product.name}</h3>
                              {isOutOfStock ? (
                                <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                  Esgotado
                                </span>
                              ) : isLowStock ? (
                                <span className="bg-amber-50 text-[#7a4b00] px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  Baixo Estoque
                                </span>
                              ) : (
                                <span className="bg-[#6bff8f]/20 text-[#007432] px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                  Disponível
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 font-medium">Unidade: {product.unit}</p>
                          </div>
                          
                          {/* Stock values */}
                          <div className="text-left sm:text-right">
                            <span className="text-xs text-gray-400 font-bold block sm:inline uppercase mr-1">Estoque:</span>
                            <span className={`text-sm font-extrabold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-[#7a4b00]' : 'text-[#007432]'}`}>
                              {product.stock} / {product.maxStock}
                            </span>
                            <span className="text-xs text-gray-400 font-bold ml-1.5">({percent}%)</span>
                          </div>
                        </div>
        
                        {/* Progress bar container */}
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4 border border-gray-50">
                          <div
                            className={`h-full transition-all duration-700 ${
                              isOutOfStock
                                ? 'bg-red-500'
                                : isLowStock
                                ? 'bg-amber-500'
                                : 'bg-green-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
        
                        {/* Sub-Alert Blocks matching mockup */}
                        {isOutOfStock && (
                          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2 text-red-800">
                            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-xs font-semibold">
                              <p className="font-extrabold uppercase text-[10px] tracking-wider">Venda Bloqueada</p>
                              <p className="mt-0.5 text-[#ba1a1a]">ESGOTADO - Venda suspensa automaticamente nos terminais de tickets.</p>
                            </div>
                          </div>
                        )}
        
                        {isLowStock && !isOutOfStock && (
                          <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2 text-amber-800">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs font-semibold">
                              <p className="font-extrabold uppercase text-[10px] tracking-wider">Notificação de Alerta</p>
                              <p className="mt-0.5 text-[#7f4f00]">Estoque Baixo - Alerta automático de reabastecimento enviado ao Caixa Central.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
        
                {/* Extra operational info banner */}
                <section className="mt-6 bg-blue-50/50 border border-blue-100/40 rounded-xl p-4 flex items-start gap-3 text-xs text-[#0050cb] font-semibold">
                  <Clock className="w-5 h-5 text-[#0066ff] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Ciclo de Produção</p>
                    <p className="text-blue-900/80 font-medium mt-0.5">
                      Os pastéis são fritos na hora sob demanda. Atente-se às notificações do painel para evitar rupturas de estoque na venda do Caixa Central.
                    </p>
                  </div>
                </section>
              </main>

      </div>
  );
}