import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { packagesService } from '../services/packages.service';
import type { Package } from '../types';
import '../pages/Panel.css';
import '../pages/Crud.css';

/**
 * Página de Entregas — Lista os pacotes cadastrados pelo app mobile.
 * Visualização administrativa (somente leitura com ações básicas).
 */
export function Packages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      if (user?.role !== 'ADMIN') {
        setPackages([]);
        return;
      }
      const result = await packagesService.findAll(1, 100, search);
      setPackages(result.packages || []);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      showToast('Erro ao carregar entregas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [search, user]);

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente',
    IN_ROUTE: 'Em Rota',
    DELIVERED: 'Entregue',
    RETURNED: 'Devolvido',
    FAILED: 'Falha',
  };

  const totalDelivered = packages.filter(p => p.status === 'DELIVERED').length;
  const totalPending = packages.filter(p => p.status === 'PENDING' || p.status === 'IN_ROUTE').length;

  return (
    <div className="page" id="packages-page">
      <header className="page-header">
        <div>
          <h1>Entregas</h1>
          <p className="page-subtitle">
            Pacotes registrados pelo aplicativo mobile
          </p>
        </div>
        <div className="page-actions">
          <input
            type="search"
            placeholder="Buscar destinatário ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="packages-search"
          />
        </div>
      </header>

      {/* Resumo */}
      <div className="dashboard-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="card card--stat">
          <span className="card-icon">TTL</span>
          <div className="card-content">
            <h3>Total</h3>
            <p className="card-value">{packages.length}</p>
            <span className="card-label">pacotes registrados</span>
          </div>
        </div>
        <div className="card card--stat">
          <span className="card-icon">OK</span>
          <div className="card-content">
            <h3>Entregues</h3>
            <p className="card-value">{totalDelivered}</p>
            <span className="card-label">concluídos</span>
          </div>
        </div>
        <div className="card card--stat">
          <span className="card-icon">PND</span>
          <div className="card-content">
            <h3>Pendentes</h3>
            <p className="card-value">{totalPending}</p>
            <span className="card-label">em andamento</span>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table" id="packages-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Destinatário</th>
                <th>Endereço</th>
                <th>Peso</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Nenhuma entrega registrada pelo mobile ainda
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <code>{pkg.trackingCode.slice(0, 10)}</code>
                    </td>
                    <td>
                      <strong>{pkg.recipientName}</strong>
                    </td>
                    <td>{pkg.address}</td>
                    <td>{pkg.weight ? `${pkg.weight} kg` : '--'}</td>
                    <td>
                      <span className={`badge badge--${pkg.status.toLowerCase()}`}>
                        {statusLabel[pkg.status] || pkg.status}
                      </span>
                    </td>
                    <td>{new Date(pkg.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
