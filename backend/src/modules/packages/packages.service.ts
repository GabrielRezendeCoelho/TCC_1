import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
            {
              recipientName: { contains: search, mode: 'insensitive' as const },
            },
            {
              trackingCode: { contains: search, mode: 'insensitive' as const },
            },
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
  async create(dto: CreatePackageDto, currentUser?: any) {
    let ownerId = currentUser?.id;

    if (!ownerId && dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: dto.routeId },
        select: { createdById: true },
      });
      if (route) {
        ownerId = route.createdById;
      }
    }

    if (dto.trackingCode && ownerId) {
      const existingPackage = await this.prisma.package.findFirst({
        where: {
          trackingCode: dto.trackingCode.trim(),
          route: {
            createdById: ownerId,
          },
        },
      });
      if (existingPackage) {
        throw new BadRequestException('Código de rastreio já cadastrado para este usuário');
      }
    }

    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: dto.routeId },
      });
      if (!route) {
        throw new NotFoundException('Rota informada não encontrada');
      }
    }

    let clientId = dto.clientId;

    if (!clientId) {
      const defaultClient = await this.prisma.client.findFirst();
      if (!defaultClient) {
        throw new Error('Nenhum cliente cadastrado no sistema');
      }
      clientId = defaultClient.id;
    }

    let latitude = dto.latitude;
    let longitude = dto.longitude;

    if (!latitude || !longitude) {
      try {
        let addressQuery = dto.address;
        
        let routeBaseAddress = null;
        let routeBaseLat = null;
        let routeBaseLng = null;
        
        if (dto.routeId) {
          const route = await this.prisma.route.findUnique({
            where: { id: dto.routeId },
            include: { createdBy: true },
          });
          if (route && route.createdBy) {
            routeBaseAddress = route.createdBy.baseAddress;
            routeBaseLat = route.createdBy.baseLat;
            routeBaseLng = route.createdBy.baseLng;
          }
        }

        if (routeBaseAddress) {
          const parts = routeBaseAddress.split('-');
          const cityState = parts.length >= 2 ? parts[1].replace('/', ', ').trim() : '';
          const cityName = cityState.split(',')[0].trim().toLowerCase();
          
          if (cityState && cityName && !dto.address.toLowerCase().includes(cityName)) {
            addressQuery = `${dto.address}, ${cityState}`;
          }
        }

        const query = encodeURIComponent(addressQuery);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`,
          {
            headers: {
              'User-Agent': 'TrackGo-Backend/1.0',
            },
          }
        );
        const results = (await response.json()) as any[];
        if (results && results.length > 0) {
          latitude = parseFloat(results[0].lat);
          longitude = parseFloat(results[0].lon);
        } else {
          // Fallback se não encontrar o endereço: usa a base
          latitude = routeBaseLat != null ? routeBaseLat + (Math.random() - 0.5) * 0.01 : -23.550520 + (Math.random() - 0.5) * 0.06;
          longitude = routeBaseLng != null ? routeBaseLng + (Math.random() - 0.5) * 0.01 : -46.633308 + (Math.random() - 0.5) * 0.06;
        }
      } catch (e) {
        console.error('Erro de geocodificação no backend:', e);
        latitude = -23.550520 + (Math.random() - 0.5) * 0.06;
        longitude = -46.633308 + (Math.random() - 0.5) * 0.06;
      }
    }

    return this.prisma.package.create({
      data: { 
        ...dto, 
        clientId,
        latitude,
        longitude
      },
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

    const data = await Promise.all(packages.map(async (pkg) => {
      let latitude = pkg.latitude;
      let longitude = pkg.longitude;

      if (!latitude || !longitude) {
        try {
          let addressQuery = pkg.address;
          let routeBaseAddress = null;
          let routeBaseLat = null;
          let routeBaseLng = null;
          
          if (pkg.routeId) {
            const route = await this.prisma.route.findUnique({
              where: { id: pkg.routeId },
              include: { createdBy: true },
            });
            if (route && route.createdBy) {
              routeBaseAddress = route.createdBy.baseAddress;
              routeBaseLat = route.createdBy.baseLat;
              routeBaseLng = route.createdBy.baseLng;
            }
          }

          if (routeBaseAddress) {
            const parts = routeBaseAddress.split('-');
            const cityState = parts.length >= 2 ? parts[1].replace('/', ', ').trim() : '';
            const cityName = cityState.split(',')[0].trim().toLowerCase();
            
            if (cityState && cityName && !pkg.address.toLowerCase().includes(cityName)) {
              addressQuery = `${pkg.address}, ${cityState}`;
            }
          }

          const query = encodeURIComponent(addressQuery);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`,
            {
              headers: {
                'User-Agent': 'TrackGo-Backend/1.0',
              },
            }
          );
          const results = (await response.json()) as any[];
          if (results && results.length > 0) {
            latitude = parseFloat(results[0].lat);
            longitude = parseFloat(results[0].lon);
          } else {
            latitude = routeBaseLat != null ? routeBaseLat + (Math.random() - 0.5) * 0.01 : -23.550520 + (Math.random() - 0.5) * 0.06;
            longitude = routeBaseLng != null ? routeBaseLng + (Math.random() - 0.5) * 0.01 : -46.633308 + (Math.random() - 0.5) * 0.06;
          }
        } catch (e) {
          console.error('Erro de geocodificação no batch do backend:', e);
          latitude = -23.550520 + (Math.random() - 0.5) * 0.06;
          longitude = -46.633308 + (Math.random() - 0.5) * 0.06;
        }
      }

      return {
        ...pkg,
        clientId: pkg.clientId || defaultClient.id,
        latitude,
        longitude,
      };
    }));

    const created = await this.prisma.package.createMany({
      data,
    });

    return { count: created.count };
  }

  async update(id: string, dto: UpdatePackageDto) {
    const existing = await this.findOne(id);

    const data: any = { ...dto };

    if (dto.address && dto.address !== existing.address && (!dto.latitude || !dto.longitude)) {
      try {
        const query = encodeURIComponent(dto.address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`,
          {
            headers: {
              'User-Agent': 'TrackGo-Backend/1.0',
            },
          }
        );
        const results = (await response.json()) as any[];
        if (results && results.length > 0) {
          data.latitude = parseFloat(results[0].lat);
          data.longitude = parseFloat(results[0].lon);
        }
      } catch (e) {
        console.error('Erro de geocodificação ao atualizar pacote:', e);
      }
    }

    return this.prisma.package.update({
      where: { id },
      data,
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
