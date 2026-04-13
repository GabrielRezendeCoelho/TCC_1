import { Injectable, Logger } from '@nestjs/common';

/**
 * Coordenada geográfica de um ponto de entrega.
 */
interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
}

/**
 * Resultado da otimização de rota.
 */
interface OptimizationResult {
  orderedWaypoints: Waypoint[];
  totalDistance: number;
  estimatedTime: number;
}

/**
 * Serviço isolado responsável por calcular rotas otimizadas
 * usando a API OSRM (Open Source Routing Machine).
 *
 * Separado do RoutesService para manter responsabilidade única
 * e facilitar testes com mock.
 */
@Injectable()
export class RouteOptimizerService {
  private readonly logger = new Logger(RouteOptimizerService.name);
  private readonly osrmBaseUrl = 'https://router.project-osrm.org';

  /**
   * Calcula a sequência otimizada de entregas usando OSRM Trip API.
   * Resolve o Travelling Salesman Problem (TSP).
   */
  async optimize(
    startPoint: { latitude: number; longitude: number },
    waypoints: Waypoint[],
  ): Promise<OptimizationResult> {
    if (waypoints.length === 0) {
      return { orderedWaypoints: [], totalDistance: 0, estimatedTime: 0 };
    }

    if (waypoints.length === 1) {
      return {
        orderedWaypoints: waypoints,
        totalDistance: 0,
        estimatedTime: 0,
      };
    }

    try {
      // Monta as coordenadas no formato lon,lat para o OSRM
      const coordinates = [
        `${startPoint.longitude},${startPoint.latitude}`,
        ...waypoints.map((wp) => `${wp.longitude},${wp.latitude}`),
      ].join(';');

      const url = `${this.osrmBaseUrl}/trip/v1/driving/${coordinates}?overview=false&source=first&roundtrip=false`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') {
        this.logger.warn(`OSRM returned: ${data.code}. Using fallback order.`);
        return this.fallbackOrder(waypoints);
      }

      const trip = data.trips[0];

      // Reordena waypoints com base na sequência otimizada do OSRM
      // O índice 0 é o ponto de partida, os waypoints começam do índice 1
      const waypointIndices = data.waypoints
        .slice(1)
        .sort(
          (a: { waypoint_index: number }, b: { waypoint_index: number }) =>
            a.waypoint_index - b.waypoint_index,
        )
        .map(
          (wp: { waypoint_index: number }) => wp.waypoint_index - 1,
        );

      const orderedWaypoints = waypointIndices.map(
        (index: number) => waypoints[index],
      );

      return {
        orderedWaypoints,
        totalDistance: Math.round(trip.distance / 1000 * 100) / 100,
        estimatedTime: Math.round(trip.duration / 60 * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Failed to optimize route via OSRM', error);
      return this.fallbackOrder(waypoints);
    }
  }

  /**
   * Fallback: retorna waypoints na ordem original caso OSRM falhe.
   */
  private fallbackOrder(waypoints: Waypoint[]): OptimizationResult {
    return {
      orderedWaypoints: waypoints,
      totalDistance: 0,
      estimatedTime: 0,
    };
  }
}
