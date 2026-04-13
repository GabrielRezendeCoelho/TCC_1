import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
  roles?: string[];
}

/**
 * Componente que protege rotas — redireciona para login se não autenticado.
 * Opcionalmente verifica roles permitidas.
 */
export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { signed, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
