import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Serviço simplificado de roles.
 * Como usamos enum do Prisma, não precisamos de tabela separada.
 */
@Injectable()
export class RolesService {
  /**
   * Retorna todas as roles disponíveis no sistema.
   */
  findAll(): { roles: Role[] } {
    return {
      roles: Object.values(Role),
    };
  }
}
