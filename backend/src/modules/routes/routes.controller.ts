import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto } from './dto';
import { PaginationDto } from '../../common/dtos';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '@prisma/client';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.routesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() dto: CreateRouteDto, @CurrentUser('id') userId: string) {
    return this.routesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Post(':id/optimize')
  @Roles(Role.ADMIN, Role.OPERATOR)
  optimize(@Param('id') id: string) {
    return this.routesService.optimize(id);
  }

  @Post(':id/assign-driver')
  @Roles(Role.ADMIN, Role.OPERATOR)
  assignDriver(
    @Param('id') routeId: string,
    @Body('driverId') driverId: string,
  ) {
    return this.routesService.assignDriver(routeId, driverId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }
}
