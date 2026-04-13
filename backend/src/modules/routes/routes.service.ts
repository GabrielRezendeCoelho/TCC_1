import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/database.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { CreateRouteDto, UpdateRouteDto } from './dto';
import { PaginationDto } from '../../common/dtos';
import { RouteStatus, PackageStatus } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routeOptimizer: RouteOptimizerService,
  ) {}

  /**
   * Lista rotas com paginação e busca.
   */
  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take: limit,
        include: {
          driver: { include: { user: { select: { name: true } } } },
          _count: { select: { packages: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      routes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Busca uma rota pelo ID com todos os detalhes.
   */
  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        driver: { include: { user: { select: { name: true, email: true } } } },
        createdBy: { select: { name: true, email: true } },
        packages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!route) {
      throw new NotFoundException('Rota não encontrada');
    }

    return route;
  }

  /**
   * Cria uma nova rota e vincula pacotes opcionais.
   */
  async create(dto: CreateRouteDto, userId: string) {
    const { packageIds, ...data } = dto;

    const route = await this.prisma.route.create({
      data: {
        ...data,
        date: new Date(dto.date),
        createdById: userId,
      },
    });

    if (packageIds && packageIds.length > 0) {
      await this.prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { routeId: route.id },
      });
    }

    return this.findOne(route.id);
  }

  /**
   * Atualiza os dados de uma rota.
   */
  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);

    const { packageIds, ...data } = dto;

    if (data.date) {
      (data as Record<string, unknown>).date = new Date(data.date);
    }

    const route = await this.prisma.route.update({
      where: { id },
      data,
    });

    if (packageIds) {
      // Remove pacotes antigos da rota
      await this.prisma.package.updateMany({
        where: { routeId: id },
        data: { routeId: null },
      });

      // Vincula novos pacotes
      if (packageIds.length > 0) {
        await this.prisma.package.updateMany({
          where: { id: { in: packageIds } },
          data: { routeId: id },
        });
      }
    }

    return this.findOne(route.id);
  }

  /**
   * Otimiza a sequência de entregas de uma rota via OSRM.
   */
  async optimize(id: string) {
    const route = await this.findOne(id);

    if (!route.startAddress) {
      throw new BadRequestException(
        'Endereço de partida é obrigatório para otimizar a rota',
      );
    }

    const packagesWithCoords = route.packages.filter(
      (pkg) => pkg.latitude !== null && pkg.longitude !== null,
    );

    if (packagesWithCoords.length < 2) {
      throw new BadRequestException(
        'São necessários pelo menos 2 pacotes com coordenadas para otimizar',
      );
    }

    // Para simplificação, usa as coordenadas do primeiro pacote como ponto de partida
    // Em produção, o startAddress seria geocodificado
    const startPoint = {
      latitude: packagesWithCoords[0].latitude!,
      longitude: packagesWithCoords[0].longitude!,
    };

    const waypoints = packagesWithCoords.map((pkg) => ({
      id: pkg.id,
      latitude: pkg.latitude!,
      longitude: pkg.longitude!,
    }));

    const result = await this.routeOptimizer.optimize(startPoint, waypoints);

    return this.prisma.route.update({
      where: { id },
      data: {
        status: RouteStatus.OPTIMIZED,
        optimizedOrder: result.orderedWaypoints.map((wp) => wp.id),
        totalDistance: result.totalDistance,
        estimatedTime: result.estimatedTime,
      },
      include: { packages: true },
    });
  }

  /**
   * Atribui um motorista a uma rota e atualiza status dos pacotes.
   */
  async assignDriver(routeId: string, driverId: string) {
    await this.findOne(routeId);

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Atualiza rota com motorista e altera status para em progresso
    const route = await this.prisma.route.update({
      where: { id: routeId },
      data: {
        driverId,
        status: RouteStatus.IN_PROGRESS,
      },
    });

    // Atualiza status dos pacotes vinculados
    await this.prisma.package.updateMany({
      where: { routeId },
      data: { status: PackageStatus.IN_ROUTE },
    });

    return this.findOne(route.id);
  }

  /**
   * Calcula distância entre dois pontos usando fórmula de Haversine (em km).
   */
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Gera rota inteligente usando Nearest Neighbor.
   * Pega o endereço base do perfil do usuário logado.
   * Ordena entregas do mais perto ao mais longe da base.
   */
  async generateSmart(
    body: { name: string; date: string; packageIds: string[] },
    userId: string,
  ) {
    // 1. Busca o perfil do usuário para pegar o endereço da base
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.baseLat || !user?.baseLng || !user?.baseAddress) {
      throw new BadRequestException(
        'Você precisa cadastrar o endereço da base no seu perfil antes de gerar uma rota inteligente.',
      );
    }

    if (!body.packageIds || body.packageIds.length === 0) {
      throw new BadRequestException('Selecione ao menos uma entrega para gerar a rota.');
    }

    // 2. Busca os pacotes selecionados
    const packages = await this.prisma.package.findMany({
      where: { id: { in: body.packageIds } },
    });

    // 3. Separa pacotes com e sem coordenadas
    const withCoords = packages.filter((p) => p.latitude != null && p.longitude != null);
    const withoutCoords = packages.filter((p) => p.latitude == null || p.longitude == null);

    // 4. Algoritmo Nearest Neighbor
    const ordered: typeof withCoords = [];
    const remaining = [...withCoords];
    let currentLat = user.baseLat;
    let currentLng = user.baseLng;
    let totalDistance = 0;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = this.haversine(
          currentLat, currentLng,
          remaining[i].latitude!, remaining[i].longitude!,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      totalDistance += nearestDist;
      currentLat = remaining[nearestIdx].latitude!;
      currentLng = remaining[nearestIdx].longitude!;
      ordered.push(remaining[nearestIdx]);
      remaining.splice(nearestIdx, 1);
    }

    // 5. Pacotes sem coordenadas vão pro final
    const finalOrder = [...ordered, ...withoutCoords];
    const orderedIds = finalOrder.map((p) => p.id);

    // 6. Cria a rota no banco
    const route = await this.prisma.route.create({
      data: {
        name: body.name,
        date: new Date(body.date),
        status: RouteStatus.OPTIMIZED,
        startAddress: user.baseAddress,
        optimizedOrder: orderedIds,
        totalDistance: Math.round(totalDistance * 100) / 100,
        estimatedTime: Math.round((totalDistance / 40) * 60), // ~40 km/h média urbana → minutos
        createdById: userId,
      },
    });

    // 7. Vincula pacotes à rota
    await this.prisma.package.updateMany({
      where: { id: { in: body.packageIds } },
      data: { routeId: route.id },
    });

    return this.findOne(route.id);
  }

  /**
   * Remove uma rota e desvincula seus pacotes.
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.package.updateMany({
      where: { routeId: id },
      data: { routeId: null, status: PackageStatus.PENDING },
    });

    return this.prisma.route.delete({ where: { id } });
  }
}
