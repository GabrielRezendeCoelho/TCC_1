import { useState, useEffect } from 'react';
import { driversService } from '../services/drivers.service';
import type { Driver } from '../types';

/**
 * Página de listagem e gerenciamento de motoristas.
 */
export function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const result = await driversService.findAll(1, 50, search);
      setDrivers(result.drivers || []);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [search]);

  return (
    <div className="page" id="drivers-page">
      <header className="page-header">
        <h1>Motoristas</h1>
        <div className="page-actions">
          <input
            type="search"
            placeholder="Buscar motorista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="drivers-search"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="drivers-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CNH</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Nenhum motorista encontrado
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td><strong>{driver.user?.name}</strong></td>
                    <td>{driver.user?.email}</td>
                    <td><code>{driver.licenseNumber}</code></td>
                    <td>{driver.phone}</td>
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
