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
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { PaginationDto } from '../../common/dtos';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll(@Query() query: PaginationDto) {
    return this.packagesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Post('batch')
  @Roles(Role.ADMIN, Role.OPERATOR)
  createBatch(@Body() packages: CreatePackageDto[]) {
    return this.packagesService.createBatch(packages);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
