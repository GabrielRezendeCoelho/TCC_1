import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/database.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { PaginationDto } from '../../common/dtos';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista pacotes com paginação e busca por nome do destinatário ou código.
   */
  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { recipientName: { contains: search, mode: 'insensitive' as const } },
            { trackingCode: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take: limit,
        include: { route: { select: { id: true, name: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.package.count({ where }),
    ]);

    return {
      packages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Busca um pacote pelo ID.
   */
  async findOne(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { route: true },
    });

    if (!pkg) {
      throw new NotFoundException('Pacote não encontrado');
    }

    return pkg;
  }

  /**
   * Retorna pacotes PENDING sem rota atribuída (disponíveis para roteirização).
   */
  async findUnassigned() {
    return this.prisma.package.findMany({
      where: {
        status: 'PENDING',
        routeId: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Registra um novo pacote de entrega.
   */
  async create(dto: CreatePackageDto) {
    let clientId = dto.clientId;

    if (!clientId) {
      const defaultClient = await this.prisma.client.findFirst();
      if (!defaultClient) {
        throw new Error('Nenhum cliente cadastrado no sistema');
      }
      clientId = defaultClient.id;
    }

    return this.prisma.package.create({ 
      data: { ...dto, clientId } 
    });
  }

  /**
   * Cria múltiplos pacotes em lote.
   */
  async createBatch(packages: CreatePackageDto[]) {
    const defaultClient = await this.prisma.client.findFirst();
    if (!defaultClient) {
      throw new Error('Nenhum cliente cadastrado no sistema');
    }

    const data = packages.map(pkg => ({
      ...pkg,
      clientId: pkg.clientId || defaultClient.id,
    }));

    const created = await this.prisma.package.createMany({
      data,
    });

    return { count: created.count };
  }

  /**
   * Atualiza os dados de um pacote.
   */
  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);

    return this.prisma.package.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Remove um pacote.
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.package.delete({ where: { id } });
  }
}
