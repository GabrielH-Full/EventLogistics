import React, { useState } from 'react';
import { LayoutDashboard, LogOut, AlertCircle } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import CentralDashboardView from '../components/CentralDashboardView';
import StallDetailsView from '../components/StallDetailsView';
import { useAppData } from '../api/useAppData';
import { useAuth } from '../auth/AuthContext';
import { Product, Ticket, Stall } from '../types';

/** Tela de detalhes de uma barraca específica, resolvida a partir do :stallId da URL. */
function StallDetailsRoute({
  stalls,
  products,
  tickets,
}: {
  stalls: Stall[];
  products: Product[];
  tickets: Ticket[];
}) {
  const { stallId } = useParams<{ stallId: string }>();
  const navigate = useNavigate();
  const stall = stalls.find(s => s.id === stallId);

  return (
    <StallDetailsView
      stallId={stallId || ''}
      stallName={stall?.name || ''}
      productId={products}
      tickets={tickets}
      onBack={() => navigate('/admin/dashboard')}
    />
  );
}

export default function AdminApp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, tickets, stalls, loading } = useAppData();

  // Estado do carrinho é mantido aqui pois pertence à venda de tickets
  // (aba "Vender Ticket", atualmente desativada - ver rota comentada abaixo).
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isDashboardArea =
    location.pathname.startsWith('/admin/dashboard') || location.pathname.startsWith('/admin/stalls');

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
              onClick={() => navigate('sell')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                location.pathname.startsWith('/admin/sell') ? 'bg-[#0066ff] text-white shadow-sm' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vender Ticket</span>
            </button>
            */} {/*button venda de ticket*/}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isDashboardArea ? 'bg-[#0066ff] text-white shadow-sm' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
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
        ) : (
          <Routes>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <CentralDashboardView
                  products={products}
                  tickets={tickets}
                  stalls={stalls}
                  onSelectStall={(stallId: string) => navigate(`/admin/stalls/${stallId}`)}
                />
              }
            />
            <Route
              path="stalls/:stallId"
              element={<StallDetailsRoute stalls={stalls} products={products} tickets={tickets} />}
            />
            {/*
            <Route
              path="sell"
              element={
                <CustomerTicketView
                  products={products}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onCheckout={handleCheckout}
                  checkoutStatus={checkoutStatus}
                />
              }
            />
            */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        )}
      </div>
    </div>
  );
}
