import React, { useState } from 'react';
import { Product, Ticket } from '../types';
import { 
  QrCode, 
  Ticket as TicketIcon, 
  Percent, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Sparkles
} from 'lucide-react';

interface SalesValidatorViewProps {
  stallName: string;
  products: Product[];
  tickets: Ticket[];
  onValidateTicket: (ticketId: string) => void;
}

export default function SalesValidatorView({
  stallName,
  products,
  tickets,
  onValidateTicket
}: SalesValidatorViewProps) {
  const [showScanModal, setShowScanModal] = useState(false);
  const [successAnim, setSuccessAnim] = useState<string | null>(null);

  // Compute stats dynamically a partir dos dados reais dessa barraca (já filtrados)
  const validatedTicketsCount = tickets.filter(t => t.status === 'validated').length;

  // Average stock of this stall's products
  const averageStock = products.length === 0 ? 0 : Math.round(
    products.reduce((acc, p) => acc + (p.stock / p.maxStock), 0) / products.length * 100
  );

  const pendingTickets = tickets.filter(t => t.status === 'pending');

  const handleScanClick = () => {
    setShowScanModal(true);
  };

  const handleValidateTicketClick = (ticketId: string) => {
    onValidateTicket(ticketId);
    
    // Trigger localized success alert animation
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSuccessAnim(ticket.code);
      setTimeout(() => {
        setSuccessAnim(null);
      }, 2500);
    }
    
    setShowScanModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#faf8ff]">
      {/* Top App Bar */}
      <header className="bg-white shadow-sm flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-[#0050cb] p-2 rounded-lg text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-[#0050cb] tracking-tight">{stallName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            Frente de Caixa
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-6">
        {/* Dynamic scan alert */}
        {successAnim && (
          <div className="mb-4 bg-[#6bff8f]/30 border border-[#007432]/30 text-[#002109] px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span>Ticket {successAnim} validado com sucesso! Pratos liberados para a entrega.</span>
          </div>
        )}

        {/* Quick Indicators Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Tickets Received indicator */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Tickets Recebidos</p>
              <p className="text-3xl font-black text-[#0050cb] mt-1">{validatedTicketsCount}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-[#0050cb]">
              <TicketIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Average Stock indicator */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Estoque Médio</p>
              <p className="text-3xl font-black text-green-600 mt-1">{averageStock}%</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-600">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Big Interactive Scanner Card matching mockup */}
        <button
          onClick={handleScanClick}
          className="w-full bg-[#0066ff] hover:bg-[#0050cb] text-white p-6 rounded-2xl flex flex-col items-center text-center gap-3 shadow-lg shadow-blue-500/15 mb-8 active:scale-[0.99] transition-all group relative overflow-hidden"
        >
          {/* Interactive glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-400/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          
          <div className="bg-white/10 p-4 rounded-full group-hover:scale-110 transition-transform">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h3 className="font-black text-lg tracking-tight">Registrar Recebimento de Ticket</h3>
            <p className="text-[11px] text-blue-100 font-semibold uppercase tracking-widest mt-1">
              {pendingTickets.length > 0 
                ? `CLIQUE PARA VALIDAR (${pendingTickets.length} pendentes)` 
                : 'CLIQUE PARA VALIDAR PAPEL DO CLIENTE'}
            </p>
          </div>

          {pendingTickets.length > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs animate-pulse">
              {pendingTickets.length}
            </span>
          )}
        </button>

        {/* Stock Monitor (Monitor de Estoque) */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-base text-[#191b24]">Monitor de Estoque</h3>
            <span className="text-xs text-[#0050cb] font-bold">{stallName}</span>
          </div>

          <div className="space-y-4">
            {products.slice(0, 3).map((product) => {
              const isOutOfStock = product.stock === 0;
              const isLowStock = product.stock > 0 && product.stock <= 15;
              const percent = Math.round((product.stock / product.maxStock) * 100);

              return (
                <div key={product.id} className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-xl border border-gray-100 shrink-0"
                  />
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-sm text-[#191b24] truncate">{product.name}</p>
                      <span className={`text-xs font-extrabold ${
                        isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {product.stock} {product.stock === 1 ? 'unid' : 'unid'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-grow bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-50">
                        <div
                          className={`h-full ${
                            isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-green-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      
                      <span className="text-[10px] font-bold text-gray-400 min-w-[28px] text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Tickets History (Últimos Tickets) */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-base text-[#191b24]">Últimos Tickets</h3>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Histórico</span>
          </div>

          <div className="space-y-3">
            {tickets.map((ticket) => {
              const isPending = ticket.status === 'pending';

              return (
                <div
                  key={ticket.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    isPending 
                      ? 'bg-amber-50/40 border-amber-200' 
                      : 'bg-gray-50/50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isPending ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-[#0050cb]'
                    }`}>
                      <TicketIcon className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-sm text-[#191b24]">
                          {ticket.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </p>
                        {isPending && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded animate-pulse">
                            Pendente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ticket {ticket.code} • {ticket.time}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <button
                        onClick={() => handleValidateTicketClick(ticket.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg active:scale-95 transition-all shadow-sm"
                      >
                        Validar
                      </button>
                    ) : (
                      <div className="text-green-600 p-1 rounded-full">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleScanClick}
            className="w-full py-3.5 border border-dashed border-[#0050cb]/30 hover:border-[#0050cb] hover:bg-[#0050cb]/5 rounded-xl font-bold text-sm text-[#0050cb] mt-4 transition-all"
          >
            Ver Histórico Completo
          </button>
        </section>
      </main>

      {/* Ticket Selector scanning sheet popup modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-lg text-[#191b24] tracking-tight">Validar Cupom do Cliente</h3>
                <p className="text-xs text-gray-400 font-medium">Selecione o ticket emitido no caixa para validar a retirada.</p>
              </div>
              <button 
                onClick={() => setShowScanModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                Cancelar
              </button>
            </div>

            {pendingTickets.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-gray-400 font-semibold text-sm">Nenhum ticket pendente no sistema.</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Acesse a aba de <span className="font-bold text-[#0066ff]">Vender Tickets</span> para simular um pedido do cliente. Ele aparecerá aqui em tempo real!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {pendingTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleValidateTicketClick(ticket.id)}
                    className="w-full text-left p-4 hover:bg-blue-50/50 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100 transition-colors group"
                  >
                    <div>
                      <span className="inline-block bg-[#0066ff]/15 text-[#0050cb] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg mb-1">
                        CUPOM {ticket.code}
                      </span>
                      <p className="font-extrabold text-sm text-[#191b24]">
                        {ticket.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wider">
                        Emitido há: {ticket.time} • Total: R$ {ticket.total.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-[#0066ff] text-white p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowScanModal(false)}
              className="mt-6 w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs active:scale-95 transition-all"
            >
              Fechar Painel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
