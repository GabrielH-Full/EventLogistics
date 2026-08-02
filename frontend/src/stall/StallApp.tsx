import React from 'react';
import { UtensilsCrossed, QrCode, LogOut } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import StallOperatorView from '../components/StallOperatorView';
import SalesValidatorView from '../components/SalesValidatorView';
import { useAppData } from '../api/useAppData';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function StallApp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, tickets, loading, stalls } = useAppData();

  const stallId = user!.stallId!;
  const stallObjet = stalls.find(s => s.id === stallId);
  const stallName = stallObjet ? stallObjet.name : user!.displayName;

  // Cada barraca só enxerga os próprios produtos, e só tickets que tenham
  // pelo menos um item dela - o resto do evento fica invisível para ela.
  const stallProducts = products.filter(p => p.stallId === stallId);
  const stallProductIds = new Set(stallProducts.map(p => p.id));
  const stallTickets = tickets.filter(t => t.items.some(item => stallProductIds.has(item.productId)));

  const handleAddProduction = (productId: string, amount: number) => {
    api.addProduction(productId, amount).catch(err => alert(err.message || 'Erro ao registrar produção.'));
  };

  const handleResetStallStock = () => {
    if (window.confirm('Deseja restaurar o estoque da sua barraca para os valores iniciais de demonstração?')) {
      api.resetStallStock(stallId).catch(err => alert(err.message || 'Erro ao redefinir estoque.'));
    }
  };

  const handleValidateTicket = (ticketId: string) => {
    api.validateTicket(ticketId).catch(err => alert(err.message || 'Erro ao validar ticket.'));
  };

  const isProduction = location.pathname.startsWith('/stall/production');
  const isValidate = location.pathname.startsWith('/stall/validate');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior fixa da conta da barraca */}
      <div className="bg-[#191b24] text-white py-3 px-4 sticky top-0 z-50 border-b border-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-black uppercase tracking-widest text-[#ecedfa]">
              {stallName} · Conta da Barraca
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              onClick={() => navigate('/stall/production')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${isProduction ? 'bg-[#0066ff] text-white shadow-sm' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Produção / Estoque</span>
            </button>
            <button
              onClick={() => navigate('/stall/validate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${isValidate ? 'bg-[#0066ff] text-white shadow-sm' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Validar Tickets</span>
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

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm font-semibold">
            Carregando dados do servidor...
          </div>
        ) : (
          <Routes>
            <Route index element={<Navigate to="/stall/production" replace />} />
            <Route
              path="production"
              element={
                <StallOperatorView
                  stallId={stallId}
                  stallName={stallName}
                  products={stallProducts}
                  tickets={stallTickets}
                  onAddProduction={handleAddProduction}
                  onResetStallStock={handleResetStallStock}
                />
              }
            />
            <Route
              path="validate"
              element={
                <SalesValidatorView
                  stallName={stallName}
                  products={stallProducts}
                  tickets={stallTickets}
                  onValidateTicket={handleValidateTicket}
                />
              }
            />
            <Route path="*" element={<Navigate to="/stall/production" replace />} />
          </Routes>
        )}
      </div>
    </div>
  );
}
