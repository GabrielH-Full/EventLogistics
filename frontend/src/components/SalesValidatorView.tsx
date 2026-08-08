import React from 'react';
import { Product, Ticket } from '../types';
import { 
  QrCode, 
  Ticket as TicketIcon, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useStallValidationCart } from '../hooks/useStallValidationCart';

interface SalesValidatorViewProps {
  stallName: string;
  products: Product[];
  tickets: Ticket[];
  onValidateTicket?: (ticketId: string) => void; // Maintained for compatibility if needed, but not used since we call API via hook
}

export default function SalesValidatorView({
  stallName,
  products,
  tickets,
}: SalesValidatorViewProps) {
  
  const {
    selectedItems,
    isSubmitting,
    error,
    totalSelectedCount,
    isValidatable,
    handleIncrement,
    handleDecrement,
    handleSubmitTicket,
    handleRevertTicket
  } = useStallValidationCart(products);

  const validatedTicketsCount = tickets.filter(t => t.status === 'validated').length;

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-[#faf8ff]">
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
        
        {error && (
          <div className="mb-4 bg-[#FFDAD6] text-[#93000A] px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Indicators Section */}
        <section className="grid grid-cols-1 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-l-4 border-l-[#0050cb] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Entregas Realizadas</p>
              <p className="text-3xl font-black text-[#0050cb] mt-1">{validatedTicketsCount}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-[#0050cb]">
              <TicketIcon className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Grid de Seleção de Produtos */}
        <h3 className="font-extrabold text-base text-[#191b24] mb-3">Selecione para Entrega</h3>
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {products.map(product => {
            const count = selectedItems[product.id] || 0;
            const isOutOfStock = product.stock === 0;
            return (
              <div 
                key={product.id} 
                className={`relative bg-white p-4 rounded-[20px] shadow-sm border select-none ${isOutOfStock ? 'opacity-50 grayscale border-gray-200 cursor-not-allowed' : 'border-gray-100 cursor-pointer active:scale-95 transition-transform'}`}
                onClick={() => !isOutOfStock && handleIncrement(product.id)}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                   {product.image ? (
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <span className="text-gray-300 font-bold">Sem img</span>
                   )}
                </div>
                {/* Title & Stock */}
                <h3 className="font-bold text-sm text-[#191b24] truncate leading-tight mb-1">{product.name}</h3>
                <p className={`text-[11px] font-extrabold uppercase tracking-wider ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Esgotado' : `${product.stock} no estoque`}
                </p>

                {/* Badge Flutuante */}
                {count > 0 && (
                  <div className="absolute -top-2 -right-2 bg-[#0066FF] text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md border-2 border-white text-sm">
                    {count}
                  </div>
                )}
                {/* Decrement Button */}
                {count > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDecrement(product.id); }}
                    className="absolute -bottom-2 -right-2 bg-[#FFDAD6] text-[#93000A] w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-red-200 active:scale-90 font-black text-lg"
                  >
                    -
                  </button>
                )}
              </div>
            )
          })}
        </section>

        {/* Painel Inferior Duplo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Stock Monitor (Monitor de Estoque) */}
          <section className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-l-4 border-l-[#006E2F] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-[#191b24]">Monitor de Estoque</h3>
            </div>
            <div className="space-y-4">
              {products.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = product.stock > 0 && product.stock <= 15;
                const percent = Math.round((product.stock / product.maxStock) * 100);

                return (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-sm text-[#191b24] truncate">{product.name}</p>
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <span className="bg-[#FFDAD6] text-[#93000A] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                              Baixo Estoque
                            </span>
                          )}
                          <span className={`text-xs font-extrabold ${
                            isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-grow bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-50">
                          <div
                            className={`h-full ${
                              isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-[#006E2F]'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Tickets History (Últimos Tickets) */}
          <section className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-[#191b24]">Últimos Tickets</h3>
            </div>
            <div className="space-y-3">
              {tickets.slice(0, 8).map((ticket, index) => {
                const isReverted = ticket.status === 'reverted';
                const isMostRecent = index === 0 && !isReverted && ticket.status === 'validated';

                return (
                  <div
                    key={ticket.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      isReverted 
                        ? 'bg-red-50/40 border-red-200 opacity-60' 
                        : 'bg-gray-50/50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-extrabold text-sm ${isReverted ? 'line-through text-gray-500' : 'text-[#191b24]'}`}>
                            {ticket.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wider">
                          Ticket {ticket.code} • {ticket.time}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isMostRecent && (
                        <button
                          onClick={() => {
                            if(window.confirm('Deseja desfazer esta validação e devolver os itens ao estoque?')) {
                              handleRevertTicket(ticket.id);
                            }
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] px-2 py-1 rounded-md active:scale-95 transition-all uppercase tracking-wider"
                        >
                          Desfazer
                        </button>
                      )}
                      {!isReverted && !isMostRecent && (
                        <div className="text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {isReverted && (
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">Estornado</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {tickets.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 font-semibold">Nenhuma entrega registrada hoje.</p>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Floating Validation Button */}
      {totalSelectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-10 fade-in duration-200">
          <button 
            onClick={handleSubmitTicket}
            disabled={!isValidatable || isSubmitting}
            className={`w-full py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 font-black text-lg text-white transition-all ${
              !isValidatable || isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed opacity-90' 
                : 'bg-[#0066FF] active:scale-95 hover:bg-[#0050CB]'
            }`}
          >
            {isSubmitting ? (
              <span className="animate-pulse">Validando...</span>
            ) : !isValidatable ? (
              <span className="text-gray-100 text-sm">Estoque insuficiente para a seleção</span>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Validar {totalSelectedCount} {totalSelectedCount === 1 ? 'Item' : 'Itens'}
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
