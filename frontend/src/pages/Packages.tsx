import { useState, useEffect } from 'react';
import { packagesService } from '../services/packages.service';
import type { Package } from '../types';

/**
 * Página de listagem e gerenciamento de pacotes.
 */
export function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const result = await packagesService.findAll(1, 50, search);
      setPackages(result.packages || []);
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [search]);

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente',
    IN_ROUTE: 'Em rota',
    DELIVERED: 'Entregue',
    RETURNED: 'Devolvido',
  };

  return (
    <div className="page" id="packages-page">
      <header className="page-header">
        <h1>Pacotes</h1>
        <div className="page-actions">
          <input
            type="search"
            placeholder="Buscar pacote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="packages-search"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="packages-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Destinatário</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Rota</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Nenhum pacote encontrado
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td><code>{pkg.trackingCode.slice(0, 8)}</code></td>
                    <td>{pkg.recipientName}</td>
                    <td>{pkg.address}</td>
                    <td>
                      <span className={`badge badge--${pkg.status.toLowerCase()}`}>
                        {statusLabel[pkg.status]}
                      </span>
                    </td>
                    <td>{pkg.route?.name || '—'}</td>
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
