import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll() {
    return this.rolesService.findAll();
  }
}
