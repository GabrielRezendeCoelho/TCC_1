import { Test, TestingModule } from '@nestjs/testing';
import { RoutesService } from './routes.service';
import { PrismaService } from '../../database/database.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RouteStatus, PackageStatus } from '@prisma/client';

describe('RoutesService', () => {
  let routesService: RoutesService;
  let prismaService: PrismaService;
  let routeOptimizerService: RouteOptimizerService;

  const mockPrismaService = {
    route: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
    package: {
      updateMany: jest.fn(),
    },
  };

  const mockOptimizerService = {
    optimize: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RouteOptimizerService, useValue: mockOptimizerService },
      ],
    }).compile();

    routesService = module.get<RoutesService>(RoutesService);
    prismaService = module.get<PrismaService>(PrismaService);
    routeOptimizerService = module.get<RouteOptimizerService>(RouteOptimizerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('optimize', () => {
    it('deve rejeitar otimização se faltar endereço de partida', async () => {
      mockPrismaService.route.findUnique.mockResolvedValue({
        id: 'route-1',
        startAddress: null,
      });

      await expect(routesService.optimize('route-1')).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar se a rota tiver menos de 2 pacotes com coordenadas mapeadas', async () => {
      mockPrismaService.route.findUnique.mockResolvedValue({
        id: 'route-1',
        startAddress: 'Rua A',
        packages: [
          { id: 'pkg-1', latitude: 10, longitude: 10 } // só 1 pacote
        ],
      });

      await expect(routesService.optimize('route-1')).rejects.toThrow(BadRequestException);
    });

    it('deve chamar o otimizador e atualizar a rota com o status OPTIMIZED em caso de sucesso', async () => {
      const mockPackages = [
        { id: 'pkg-1', latitude: 10, longitude: 10 },
        { id: 'pkg-2', latitude: 20, longitude: 20 },
      ];
      
      mockPrismaService.route.findUnique.mockResolvedValue({
        id: 'route-1',
        startAddress: 'Rua Start',
        packages: mockPackages,
      });

      mockOptimizerService.optimize.mockResolvedValue({
        orderedWaypoints: [{ id: 'pkg-2' }, { id: 'pkg-1' }],
        totalDistance: 15.5,
        estimatedTime: 30,
      });

      mockPrismaService.route.update.mockResolvedValue({ status: RouteStatus.OPTIMIZED });

      await routesService.optimize('route-1');

      expect(routeOptimizerService.optimize).toHaveBeenCalled();
      expect(prismaService.route.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: RouteStatus.OPTIMIZED,
          totalDistance: 15.5,
        })
      }));
    });
  });

  describe('assignDriver', () => {
    it('deve lançar erro se motorista não existir', async () => {
      mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
      mockPrismaService.driver.findUnique.mockResolvedValue(null);

      await expect(routesService.assignDriver('route-1', 'driver-1')).rejects.toThrow(NotFoundException);
    });

    it('deve atribuir o motorista, atualizar rota para IN_PROGRESS e pacotes para IN_ROUTE', async () => {
      mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
      mockPrismaService.driver.findUnique.mockResolvedValue({ id: 'driver-1' });
      mockPrismaService.route.update.mockResolvedValue({ id: 'route-1', status: RouteStatus.IN_PROGRESS });

      await routesService.assignDriver('route-1', 'driver-1');

      // Verifica atualização da rota
      expect(prismaService.route.update).toHaveBeenCalledWith({
        where: { id: 'route-1' },
        data: { driverId: 'driver-1', status: RouteStatus.IN_PROGRESS },
      });

      // Verifica atualização em cascata dos pacotes
      expect(prismaService.package.updateMany).toHaveBeenCalledWith({
        where: { routeId: 'route-1' },
        data: { status: PackageStatus.IN_ROUTE },
      });
    });
  });
});
