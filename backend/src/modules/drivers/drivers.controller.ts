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
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto } from './dto';
import { PaginationDto } from '../../common/dtos';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll(@Query() query: PaginationDto) {
    return this.driversService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Get(':id/routes')
  findRoutes(@Param('id') id: string) {
    return this.driversService.findRoutes(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }
}
