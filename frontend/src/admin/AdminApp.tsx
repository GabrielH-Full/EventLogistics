import React, { useState } from 'react';
import { Store, LayoutDashboard, LogOut, AlertCircle } from 'lucide-react';
import CustomerTicketView from '../components/CustomerTicketView';
import CentralDashboardView from '../components/CentralDashboardView';
import StallDetailsView from '../components/StallDetailsView';
import { useAppData } from '../api/useAppData';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Product } from '../types';

type Tab = 'sell' | 'dashboard';

export default function AdminApp() {
  const { user, logout } = useAuth();
  const { products, tickets, stalls, loading } = useAppData();
  const [tab, setTab] = useState<Tab>('sell');
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const currentQty = prev[product.id] || 0;
      if (currentQty >= product.stock) return prev;
      return { ...prev, [product.id]: currentQty + 1 };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setCart(prev => ({ ...prev, [productId]: Math.min(quantity, product.stock) }));
  };

  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) return;

    setCheckoutStatus('processing');
    setCheckoutError(null);

    const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity: quantity as number }));

    try {
      // Toda a regra de negócio (checar estoque, debitar, criar o ticket) roda
      // no backend. A tela só reflete o resultado - por isso é seguro mesmo
      // se dois caixas tentarem vender o último item ao mesmo tempo.
      await api.createTicket(items);
      setCheckoutStatus('success');
      setTimeout(() => {
        setCart({});
        setCheckoutStatus('idle');
      }, 2000);
    } catch (err) {
      setCheckoutStatus('idle');
      setCheckoutError(err instanceof ApiError ? err.message : 'Falha ao registrar a venda.');
      setTimeout(() => setCheckoutError(null), 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior fixa da conta ADM */}
      <div className="bg-[#191b24] text-white py-3 px-4 sticky top-0 z-50 border-b border-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-black uppercase tracking-widest text-[#ecedfa]">
              {user?.displayName} · Conta ADM
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {/*
            <button
              onClick={() => setTab('sell')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                tab === 'sell' ? 'bg-[#0066ff] text-white shadow-sm' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vender Ticket</span>
            </button>
            */} {/*button venda de ticket*/}
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                tab === 'dashboard' ? 'bg-[#0066ff] text-white shadow-sm' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Painel Geral</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-800 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {checkoutError && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm font-semibold">
            Carregando dados do servidor...
          </div>
        ) : selectedStallId ? (
          <StallDetailsView
          stallId={selectedStallId}
          stallName={stalls.find(s => s.id === selectedStallId)?.name || ''}
          productId={products}
          tickets={tickets}
          onBack={() => setSelectedStallId(null)}
          />
        )
        //: tab === 'sell' ? (
        //  <CustomerTicketView
        //    products={products}
        //    cart={cart}
       //    onAddToCart={handleAddToCart}
        //    onRemoveFromCart={handleRemoveFromCart}
        //    onUpdateCartQuantity={handleUpdateCartQuantity}
        //    onCheckout={handleCheckout}
        //    checkoutStatus={checkoutStatus}
        //  />
       // ) 
        : (
          <CentralDashboardView products={products} tickets={tickets} stalls={stalls} onSelectStall={setSelectedStallId} />
        )}
      </div>
    </div>
  );
}
