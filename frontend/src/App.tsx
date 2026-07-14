import React from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginView from './auth/LoginView';
import AdminApp from './admin/AdminApp';
import StallApp from './stall/StallApp';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm font-semibold">
        Carregando...
      </div>
    );
  }

  if (!user) return <LoginView />;

  // Área ADM (Caixa Central): venda de tickets + painel geral de todas as barracas.
  // Área da Barraca: produção/estoque + validação de tickets, restrita à própria barraca.
  return user.role === 'admin' ? <AdminApp /> : <StallApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
