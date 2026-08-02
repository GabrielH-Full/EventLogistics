import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm font-semibold">
      Carregando...
    </div>
  );
}

/** Rota de destino padrão para cada papel de usuário. */
export function homeForRole(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/stall';
}

/**
 * Protege um conjunto de rotas exigindo usuário autenticado.
 * Se `allowedRoles` for informado, também restringe pelo papel do usuário,
 * redirecionando para a área correta caso o papel não bata.
 */
export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  // LOG TEMPORÁRIO - remover depois de descobrir o problema
  console.log('[ProtectedRoute]', {
    path: location.pathname,
    loading,
    user,
    allowedRoles,
  });

  if (loading) return <LoadingScreen />;

  if (!user) {
    console.log('[ProtectedRoute] sem user -> /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== 'admin' && user.role !== 'stall' && user.role !== 'operator') {
    console.log('[ProtectedRoute] role inválido:', user.role, '-> logout + /login');
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const target = homeForRole(user.role);
    if (location.pathname === target || location.pathname.startsWith(`${target}/`)) {
      console.log('[ProtectedRoute] já está no destino, não redireciona de novo');
      return <Outlet />;
    }
    console.log('[ProtectedRoute] role não permitido aqui ->', target);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

/**
 * Usado na tela de login: se o usuário já estiver autenticado,
 * manda direto para a área correspondente ao seu papel.
 */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  console.log('[PublicOnlyRoute]', { loading, user });

  if (loading) return <LoadingScreen />;
  if (user) {
    console.log('[PublicOnlyRoute] já logado -> redirecionando para', homeForRole(user.role));
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <Outlet />;
}

export { LoadingScreen };