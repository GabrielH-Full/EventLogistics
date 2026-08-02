import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute, PublicOnlyRoute, homeForRole, LoadingScreen } from './auth/ProtectedRoute';
import LoginView from './auth/LoginView';
import AdminApp from './admin/AdminApp';
import StallApp from './stall/StallApp';

/** Rota "/" - manda o usuário para login ou para a área do seu papel. */
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginView />} />
      </Route>

      {/* Área ADM (Caixa Central): venda de tickets + painel geral de todas as barracas. */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/*" element={<AdminApp />} />
      </Route>

      {/* Área da Barraca: produção/estoque + validação de tickets, restrita à própria barraca. */}
      <Route element={<ProtectedRoute allowedRoles={['stall', 'operator']} />}>
        <Route path="/stall/*" element={<StallApp />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

import { ToastProvider } from './components/admin/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
