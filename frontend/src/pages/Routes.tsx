import { useState, useEffect } from 'react';
import { routesService } from '../services/routes.service';
import type { DeliveryRoute } from '../types';

/**
 * Página de listagem e gerenciamento de rotas.
 */
export function Routes() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const result = await routesService.findAll(1, 50, search);
      setRoutes(result.routes || []);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [search]);

  const statusLabel: Record<string, string> = {
    DRAFT: 'Rascunho',
    OPTIMIZED: 'Otimizada',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
  };

  return (
    <div className="page" id="routes-page">
      <header className="page-header">
        <h1>Rotas</h1>
        <div className="page-actions">
          <input
            type="search"
            placeholder="Buscar rota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="routes-search"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="routes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Pacotes</th>
                <th>Distância</th>
                <th>Motorista</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Nenhuma rota encontrada
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id}>
                    <td><strong>{route.name}</strong></td>
                    <td>{new Date(route.date).toLocaleDateString('pt-BR')}</td>
                    <td>{route._count?.packages ?? 0}</td>
                    <td>{route.totalDistance ? `${route.totalDistance} km` : '—'}</td>
                    <td>{route.driver?.user?.name || '—'}</td>
                    <td>
                      <span className={`badge badge--${route.status.toLowerCase()}`}>
                        {statusLabel[route.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
