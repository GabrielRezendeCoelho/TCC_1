import { Injectable } from '@nestjs/common';
import { LockedLoggerService } from '../../../common/interceptors';
import {
  IRouteOptimizer,
  Waypoint,
  OptimizationResult,
} from '../interfaces/route-optimizer.interface';

/**
 * SOLID — Single Responsibility Principle (SRP)
 *
 * Serviço isolado responsável EXCLUSIVAMENTE por calcular rotas otimizadas
 * usando a API OSRM (Open Source Routing Machine).
 * Ele não acessa o banco de dados nem sabe de regras de negócio de pacotes.
 *
 * SOLID — Dependency Inversion Principle (DIP)
 *
 * Implementa a abstração IRouteOptimizer, permitindo que quem o consome
 * dependa de uma abstração e não de uma implementação concreta.
 *
 * Utiliza o LockedLoggerService (Mutex) para garantir que os logs
 * de otimização sejam escritos de forma serializada, sem intercalação
 * em chamadas concorrentes.
 */
@Injectable()
export class RouteOptimizerService implements IRouteOptimizer {
  private readonly osrmBaseUrl = 'https://router.project-osrm.org';

  constructor(private readonly lockedLogger: LockedLoggerService) {}

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

    return this.lockedLogger.executeWithLock(
      'RouteOptimizer',
      'optimize_route_osrm',
      { waypointCount: waypoints.length },
      async () => {
        try {
          // Monta as coordenadas no formato lon,lat para o OSRM
          const coordinates = [
            `${startPoint.longitude},${startPoint.latitude}`,
            ...waypoints.map((wp) => `${wp.longitude},${wp.latitude}`),
          ].join(';');

          const url = `${this.osrmBaseUrl}/trip/v1/driving/${coordinates}?overview=false&source=first&roundtrip=false`;

          const response = await fetch(url);
          interface OsrmResponse {
            code: string;
            trips?: Array<{ distance: number; duration: number }>;
            waypoints?: Array<{ waypoint_index: number }>;
          }

          const data = (await response.json()) as OsrmResponse;

          if (
            data.code !== 'Ok' ||
            !data.trips ||
            !data.waypoints ||
            data.trips.length === 0
          ) {
            await this.lockedLogger.logWarn(
              'RouteOptimizer',
              `OSRM retornou código não-OK ou dados incompletos: ${data.code}. Utilizando fallback.`,
              { osrmCode: data.code },
            );
            return this.fallbackOrder(waypoints);
          }

          const trip = data.trips[0];

          // Reordena waypoints com base na sequência otimizada do OSRM.
          // Os waypoints no JSON retornado pela API OSRM Trip já estão na ordem otimizada de visitação.
          // O primeiro elemento (índice 0) é o ponto de partida, os próximos são as entregas.
          const waypointIndices = data.waypoints
            .slice(1)
            .map((wp: { waypoint_index: number }) => wp.waypoint_index - 1);

          const orderedWaypoints = waypointIndices.map(
            (index: number) => waypoints[index],
          );

          const result: OptimizationResult = {
            orderedWaypoints,
            totalDistance: Math.round((trip.distance / 1000) * 100) / 100,
            estimatedTime: Math.round((trip.duration / 60) * 100) / 100,
          };

          return result;
        } catch (error) {
          await this.lockedLogger.logError(
            'RouteOptimizer',
            'Falha ao otimizar rota via OSRM. Utilizando fallback.',
            error instanceof Error ? error : new Error(String(error)),
            { waypointCount: waypoints.length },
          );
          return this.fallbackOrder(waypoints);
        }
      },
    );
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
