import { useAuth } from '../contexts/AuthContext';

/**
 * Página inicial do painel — resumo da operação do dia.
 */
export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page" id="dashboard-page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">
          Bem-vindo, <strong>{user?.name}</strong>
        </p>
      </header>

      <div className="dashboard-cards">
        <div className="card card--stat" id="stat-packages">
          <span className="card-icon">📦</span>
          <div className="card-content">
            <h3>Pacotes</h3>
            <p className="card-value">—</p>
            <span className="card-label">registrados hoje</span>
          </div>
        </div>

        <div className="card card--stat" id="stat-routes">
          <span className="card-icon">🗺️</span>
          <div className="card-content">
            <h3>Rotas</h3>
            <p className="card-value">—</p>
            <span className="card-label">ativas hoje</span>
          </div>
        </div>

        <div className="card card--stat" id="stat-drivers">
          <span className="card-icon">🚗</span>
          <div className="card-content">
            <h3>Motoristas</h3>
            <p className="card-value">—</p>
            <span className="card-label">em operação</span>
          </div>
        </div>

        <div className="card card--stat" id="stat-delivered">
          <span className="card-icon">✅</span>
          <div className="card-content">
            <h3>Entregas</h3>
            <p className="card-value">—</p>
            <span className="card-label">concluídas hoje</span>
          </div>
        </div>
      </div>
    </div>
  );
}
