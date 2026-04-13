import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/database.service';
import { CreateDriverDto, UpdateDriverDto } from './dto';
import { PaginationDto } from '../../common/dtos';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista motoristas com paginação e busca.
   */
  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
            { licenseNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [drivers, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.driver.count({ where }),
    ]);

    return {
      drivers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Busca um motorista pelo ID.
   */
  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        routes: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    return driver;
  }

  /**
   * Cria um novo perfil de motorista vinculado a um usuário.
   */
  async create(dto: CreateDriverDto) {
    const existingDriver = await this.prisma.driver.findUnique({
      where: { userId: dto.userId },
    });

    if (existingDriver) {
      throw new ConflictException('Usuário já possui perfil de motorista');
    }

    return this.prisma.driver.create({
      data: dto,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Atualiza os dados do motorista.
   */
  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);

    return this.prisma.driver.update({
      where: { id },
      data: dto,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Remove um perfil de motorista.
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.driver.delete({ where: { id } });
  }

  /**
   * Retorna as rotas atribuídas a um motorista.
   */
  async findRoutes(id: string) {
    await this.findOne(id);

    return this.prisma.route.findMany({
      where: { driverId: id },
      include: { packages: true },
      orderBy: { date: 'desc' },
    });
  }
}
