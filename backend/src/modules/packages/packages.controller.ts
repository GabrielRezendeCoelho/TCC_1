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
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '@prisma/client';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.DRIVER)
  findAll(@Query() query: PaginationDto) {
    return this.packagesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.DRIVER)
  create(
    @Body() dto: Record<string, any>,
    @CurrentUser() user: any,
  ) {
    return this.packagesService.create(dto as CreatePackageDto, user);
  }

  @Post('batch')
  @Roles(Role.ADMIN, Role.OPERATOR)
  createBatch(@Body() packages: CreatePackageDto[]) {
    return this.packagesService.createBatch(packages);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR, Role.DRIVER)
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Get('unassigned')
  @Roles(Role.ADMIN, Role.OPERATOR)
  findUnassigned() {
    return this.packagesService.findUnassigned();
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OPERATOR, Role.DRIVER)
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
