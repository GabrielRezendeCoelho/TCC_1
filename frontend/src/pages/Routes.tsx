import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { routesService } from '../services/routes.service'
import type { DeliveryRoute } from '../types'
import '../pages/Panel.css'
import '../pages/Crud.css'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  OPTIMIZED: 'Otimizada',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Finalizada',
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'badge--draft',
  OPTIMIZED: 'badge--optimized',
  IN_PROGRESS: 'badge--in_progress',
  COMPLETED: 'badge--completed',
}

/**
 * Página de Rotas — Lista as rotas de entrega criadas pelo mobile.
 * Visualização administrativa (somente leitura).
 * Ao clicar numa rota, navega para o detalhe com as entregas.
 */
export function Routes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadRoutes = async () => {
    setIsLoading(true)
    try {
      if (user?.role !== 'ADMIN') {
        setRoutes([])
        return
      }
      const result = await routesService.findAll(1, 100, search)
      setRoutes(result.routes || [])
    } catch (error) {
      console.error('Erro ao carregar rotas:', error)
      showToast('Erro ao carregar rotas', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRoutes()
  }, [search, user])

  const totalInProgress = routes.filter(
    (r) => r.status === 'IN_PROGRESS' || r.status === 'OPTIMIZED'
  ).length
  const totalCompleted = routes.filter((r) => r.status === 'COMPLETED').length

  return (
    <div className="page" id="routes-page">
      <header className="page-header">
        <div>
          <h1>Rotas</h1>
          <p className="page-subtitle">
            Rotas de entrega criadas pelo aplicativo mobile
          </p>
        </div>
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

      {/* Resumo */}
      <div className="dashboard-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="card card--stat">
          <div className="card-content">
            <h3>Total</h3>
            <p className="card-value">{routes.length}</p>
            <span className="card-label">rotas registradas</span>
          </div>
        </div>
        <div className="card card--stat">
          <div className="card-content">
            <h3>Em Andamento</h3>
            <p className="card-value">{totalInProgress}</p>
            <span className="card-label">rotas ativas</span>
          </div>
        </div>
        <div className="card card--stat">
          <div className="card-content">
            <h3>Finalizadas</h3>
            <p className="card-value">{totalCompleted}</p>
            <span className="card-label">rotas concluídas</span>
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
          <table className="table" id="routes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Motorista</th>
                <th>Pacotes</th>
                <th>Distância</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    Nenhuma rota registrada ainda
                  </td>
                </tr>
              ) : (
                routes.map((route) => {
                  const pkgCount =
                    route.packages?.length ?? route._count?.packages ?? 0
                  const delivered =
                    route.packages?.filter(
                      (p) =>
                        p.status === 'DELIVERED' || p.status === 'RETURNED'
                    ).length ?? 0

                  return (
                    <tr
                      key={route.id}
                      className="table-row-clickable"
                      onClick={() => navigate(`/routes/${route.id}`)}
                    >
                      <td>
                        <strong>{route.name}</strong>
                      </td>
                      <td>
                        {new Date(route.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td>{route.driver?.user?.name || '—'}</td>
                      <td>
                        {delivered}/{pkgCount}
                      </td>
                      <td>
                        {route.totalDistance
                          ? `${route.totalDistance.toFixed(1)} km`
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${STATUS_CLASS[route.status] || 'badge--draft'}`}
                        >
                          {STATUS_LABELS[route.status] || route.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon edit"
                          title="Ver detalhes"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/routes/${route.id}`)
                          }}
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
