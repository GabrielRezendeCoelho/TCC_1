/**
 * SOLID — Interface Segregation Principle (ISP) & Dependency Inversion Principle (DIP)
 *
 * Esta interface define o contrato de otimização de rotas.
 * O serviço RoutesService não dependerá mais da implementação concreta (RouteOptimizerService),
 * mas sim desta abstração. Isso facilita testes (Mocks) e permite trocar o algoritmo
 * de roteirização no futuro sem alterar o caso de uso.
 */

export interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
}

export interface OptimizationResult {
  orderedWaypoints: Waypoint[];
  totalDistance: number;
  estimatedTime: number;
}

export interface IRouteOptimizer {
  optimize(
    startPoint: { latitude: number; longitude: number },
    waypoints: Waypoint[],
  ): Promise<OptimizationResult>;
}

export const ROUTE_OPTIMIZER_TOKEN = Symbol('IRouteOptimizer');
