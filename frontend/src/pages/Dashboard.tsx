import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { packagesService } from '../services/packages.service';
import { routesService } from '../services/routes.service';
import { driversService } from '../services/drivers.service';
import '../pages/Panel.css';

/**
 * Página inicial do painel — resumo da operação logística.
 * Puxa dados reais de cada módulo para exibir os KPIs de resumo.
 */
export function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    packages: 0,
    routes: 0,
    drivers: 0,
    delivered: 0,
  });
  const [recentPackages, setRecentPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [pkgResult, routeResult, driverResult] = await Promise.all([
          packagesService.findAll(1, 50).catch(() => ({ packages: [], meta: { total: 0 } })),
          routesService.findAll(1, 50).catch(() => ({ routes: [], meta: { total: 0 } })),
          driversService.findAll(1, 50).catch(() => ({ drivers: [], meta: { total: 0 } })),
        ]);

        const pkgs = pkgResult.packages || [];
        const delivered = pkgs.filter((p: any) => p.status === 'DELIVERED').length;

        setStats({
          packages: pkgResult.meta?.total || pkgs.length,
          routes: routeResult.meta?.total || (routeResult.routes || []).length,
          drivers: driverResult.meta?.total || (driverResult.drivers || []).length,
          delivered,
        });

        setRecentPackages(pkgs.slice(0, 5));
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente',
    IN_ROUTE: 'Em rota',
    DELIVERED: 'Entregue',
    RETURNED: 'Devolvido',
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page" id="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Bem-vindo, <strong>{user?.name || 'Administrador'}</strong>
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="dashboard-cards">
        <div className="card card--stat" id="stat-packages">
          <span className="card-icon">📦</span>
          <div className="card-content">
            <h3>Pacotes</h3>
            <p className="card-value">{stats.packages}</p>
            <span className="card-label">registrados no sistema</span>
          </div>
        </div>

        <div className="card card--stat" id="stat-routes">
          <span className="card-icon">🗺️</span>
          <div className="card-content">
            <h3>Rotas</h3>
            <p className="card-value">{stats.routes}</p>
            <span className="card-label">criadas</span>
          </div>
        </div>

        <div className="card card--stat" id="stat-drivers">
          <span className="card-icon">🚗</span>
          <div className="card-content">
            <h3>Motoristas</h3>
            <p className="card-value">{stats.drivers}</p>
            <span className="card-label">cadastrados</span>
          </div>
        </div>

        <div className="card card--stat" id="stat-delivered">
          <span className="card-icon">✅</span>
          <div className="card-content">
            <h3>Entregas</h3>
            <p className="card-value">{stats.delivered}</p>
            <span className="card-label">concluídas</span>
          </div>
        </div>
      </div>

      {/* Últimos Pacotes */}
      <div className="dashboard-section">
        <h2>📋 Últimos Pacotes</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Destinatário</th>
                <th>Endereço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPackages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Nenhum pacote registrado ainda
                  </td>
                </tr>
              ) : (
                recentPackages.map((pkg: any) => (
                  <tr key={pkg.id}>
                    <td><code>{pkg.trackingCode}</code></td>
                    <td>{pkg.recipientName}</td>
                    <td>{pkg.address}</td>
                    <td>
                      <span className={`badge badge--${pkg.status.toLowerCase()}`}>
                        {statusLabel[pkg.status] || pkg.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
