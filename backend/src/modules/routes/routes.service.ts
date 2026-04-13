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
