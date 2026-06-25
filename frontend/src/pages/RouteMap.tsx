import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { routesService } from '../services/routes.service'
import type { DeliveryRoute } from '../types'
import '../pages/Panel.css'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_ROUTE: '#3b82f6',
  DELIVERED: '#22c55e',
  RETURNED: '#ef4444',
  FAILED: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_ROUTE: 'Em Rota',
  DELIVERED: 'Entregue',
  RETURNED: 'Devolvido',
  FAILED: 'Falha',
}

/**
 * Cria um ícone circular numerado para os marcadores do mapa.
 */
function createNumberedIcon(number: number, color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 30px; height: 30px; border-radius: 50%;
      background: ${color}; border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: bold; font-size: 13px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

/**
 * Cria o ícone da base (casa verde).
 */
function createBaseIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: #10b981; border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">🏠</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

/**
 * Página de Mapa da Rota — visualização somente leitura com Leaflet.
 * Exibe marcadores numerados + polyline OSRM + legenda.
 */
export function RouteMap() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const [route, setRoute] = useState<DeliveryRoute | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!routeId) return
    setIsLoading(true)
    routesService
      .findOne(routeId)
      .then((data) => setRoute(data))
      .catch(() => navigate('/routes'))
      .finally(() => setIsLoading(false))
  }, [routeId, navigate])

  // Inicializa o mapa e renderiza marcadores + polyline
  useEffect(() => {
    if (!route || !mapContainerRef.current) return

    // Se já existe um mapa, destruí-lo antes de recriar
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    // Ordena pacotes pela ordem otimizada
    const orderedPackages = [...(route.packages || [])]
    if (route.optimizedOrder && route.optimizedOrder.length > 0) {
      orderedPackages.sort((a, b) => {
        const indexA = route.optimizedOrder!.indexOf(a.id)
        const indexB = route.optimizedOrder!.indexOf(b.id)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      })
    }

    const packagesWithCoords = orderedPackages.filter(
      (p) => p.latitude != null && p.longitude != null
    )

    // Dados da base
    const createdBy = (route as any)?.createdBy
    const baseLat = createdBy?.baseLat
    const baseLng = createdBy?.baseLng
    const baseAddress = createdBy?.baseAddress || 'Base'

    // Calcula centro e bounds
    const allCoords: [number, number][] = []
    if (baseLat != null && baseLng != null) {
      allCoords.push([baseLat, baseLng])
    }
    packagesWithCoords.forEach((p) => {
      allCoords.push([p.latitude!, p.longitude!])
    })

    if (allCoords.length === 0) {
      allCoords.push([-23.5505, -46.6333]) // Fallback São Paulo
    }

    // Cria o mapa
    const map = L.map(mapContainerRef.current, {
      center: allCoords[0],
      zoom: 13,
      zoomControl: true,
    })
    mapInstanceRef.current = map

    // Tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    // Marcador da Base
    if (baseLat != null && baseLng != null) {
      L.marker([baseLat, baseLng], { icon: createBaseIcon() })
        .addTo(map)
        .bindPopup(`<strong>Base (Ponto de Partida)</strong><br/>${baseAddress}`)
    }

    // Marcadores dos pacotes
    packagesWithCoords.forEach((pkg, index) => {
      const color = STATUS_COLORS[pkg.status] || '#6366f1'
      L.marker([pkg.latitude!, pkg.longitude!], {
        icon: createNumberedIcon(index + 1, color),
      })
        .addTo(map)
        .bindPopup(
          `<div style="min-width: 180px;">
            <div style="color: #6366f1; font-weight: bold; font-size: 11px; margin-bottom: 2px;">Parada #${index + 1}</div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${pkg.recipientName}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">${pkg.address}</div>
            <span style="background: ${color}30; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
              ${STATUS_LABELS[pkg.status] || pkg.status}
            </span>
          </div>`
        )
    })

    // Ajusta o mapa para mostrar todos os pontos
    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1])))
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    // Busca a polyline real pelas ruas via OSRM
    if (allCoords.length >= 2) {
      const coordString = allCoords
        .map((c) => `${c[1]},${c[0]}`)
        .join(';')
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if (
            data.code === 'Ok' &&
            data.routes &&
            data.routes.length > 0 &&
            data.routes[0].geometry?.coordinates
          ) {
            const path: [number, number][] =
              data.routes[0].geometry.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]]
              )
            L.polyline(path, {
              color: '#6366f1',
              weight: 4,
              opacity: 0.8,
            }).addTo(map)
          } else {
            // Fallback: linha reta entre os pontos
            L.polyline(
              allCoords.map((c) => L.latLng(c[0], c[1])),
              { color: '#6366f1', weight: 3, dashArray: '8, 8' }
            ).addTo(map)
          }
        })
        .catch(() => {
          // Fallback: linha reta tracejada
          L.polyline(
            allCoords.map((c) => L.latLng(c[0], c[1])),
            { color: '#6366f1', weight: 3, dashArray: '8, 8' }
          ).addTo(map)
        })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [route])

  // Identifica os status presentes para a legenda
  const presentStatuses = route?.packages
    ? [...new Set(route.packages.map((p) => p.status))]
    : []

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="page" id="route-map-page" style={{ padding: 0 }}>
      {/* Header */}
      <div className="map-header">
        <button
          className="btn-back"
          onClick={() => navigate(`/routes/${routeId}`)}
          title="Voltar para detalhes"
        >
          ← Voltar
        </button>
        <h1 className="map-title">{route?.name || 'Mapa da Rota'}</h1>
      </div>

      {/* Mapa */}
      <div className="map-container" ref={mapContainerRef} />

      {/* Legenda */}
      {presentStatuses.length > 0 && (
        <div className="map-legend">
          <span className="map-legend-title">
            {route?.packages?.length || 0} entregas
          </span>
          <div className="map-legend-items">
            <div className="map-legend-item">
              <span
                className="map-legend-dot"
                style={{ background: '#10b981' }}
              />
              <span>Base</span>
            </div>
            {presentStatuses.map((status) => (
              <div key={status} className="map-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ background: STATUS_COLORS[status] || '#6366f1' }}
                />
                <span>{STATUS_LABELS[status] || status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
