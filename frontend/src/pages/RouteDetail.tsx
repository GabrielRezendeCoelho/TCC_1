import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const PKG_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_ROUTE: 'Em Rota',
  DELIVERED: 'Entregue',
  RETURNED: 'Devolvido',
  FAILED: 'Falha',
}

/**
 * Página de Detalhe de Rota — exibe informações da rota e suas entregas.
 * Somente leitura, alinhada com o RouteDetailScreen do mobile.
 */
export function RouteDetail() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const [route, setRoute] = useState<DeliveryRoute | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!routeId) return
    setIsLoading(true)
    routesService
      .findOne(routeId)
      .then((data) => setRoute(data))
      .catch(() => {
        navigate('/routes')
      })
      .finally(() => setIsLoading(false))
  }, [routeId, navigate])

  if (isLoading || !route) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  // Ordena pacotes pela ordem otimizada, se existir
  const orderedPackages = [...(route.packages || [])]
  if (route.optimizedOrder && route.optimizedOrder.length > 0) {
    orderedPackages.sort((a, b) => {
      const indexA = route.optimizedOrder!.indexOf(a.id)
      const indexB = route.optimizedOrder!.indexOf(b.id)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
  }

  const completed = orderedPackages.filter(
    (p) => p.status === 'DELIVERED' || p.status === 'RETURNED'
  ).length
  const total = orderedPackages.length
  const progressPercent = total > 0 ? (completed / total) * 100 : 0

  const isOptimized =
    route.status === 'OPTIMIZED' ||
    route.status === 'IN_PROGRESS' ||
    route.status === 'COMPLETED'

  return (
    <div className="page" id="route-detail-page">
      {/* Header */}
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-back"
            onClick={() => navigate('/routes')}
            title="Voltar para rotas"
          >
            ← Voltar
          </button>
          <div>
            <h1>{route.name}</h1>
            <p className="page-subtitle">
              {new Date(route.date).toLocaleDateString('pt-BR')} •{' '}
              {route.driver?.user?.name
                ? `Motorista: ${route.driver.user.name}`
                : 'Sem motorista atribuído'}
            </p>
          </div>
        </div>
      </header>

      {/* Info Cards */}
      <div className="route-detail-info">
        <div className="route-detail-badges">
          <span
            className={`badge ${STATUS_CLASS[route.status] || 'badge--draft'}`}
          >
            {STATUS_LABELS[route.status] || route.status}
          </span>
          {isOptimized && route.totalDistance && (
            <span className="badge badge--optimized">
              🗺️ {route.totalDistance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Progresso das Entregas</span>
            <span className="progress-count">
              {completed} de {total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Botão de Mapa */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            className="btn-map"
            onClick={() => navigate(`/routes/${routeId}/map`)}
          >
            🗺️ Ver no Mapa
          </button>
        </div>
      </div>

      {/* Tabela de Entregas */}
      <div className="dashboard-section">
        <h2>Entregas da Rota</h2>
        <div className="table-container">
          <table className="table" id="route-packages-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Destinatário</th>
                <th>Endereço</th>
                <th>Peso</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orderedPackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Nenhuma entrega nesta rota
                  </td>
                </tr>
              ) : (
                orderedPackages.map((pkg, index) => (
                  <tr key={pkg.id}>
                    <td>
                      <span className="stop-number">{index + 1}</span>
                    </td>
                    <td>
                      <code>{pkg.trackingCode.slice(0, 10)}</code>
                    </td>
                    <td>
                      <strong>{pkg.recipientName}</strong>
                    </td>
                    <td>{pkg.address}</td>
                    <td>{pkg.weight ? `${pkg.weight} kg` : '—'}</td>
                    <td>
                      <span
                        className={`badge badge--${pkg.status.toLowerCase()}`}
                      >
                        {PKG_STATUS_LABELS[pkg.status] || pkg.status}
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
  )
}
