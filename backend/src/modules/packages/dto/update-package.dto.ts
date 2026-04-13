import { PartialType } from '@nestjs/mapped-types';
import { CreatePackageDto } from './create-package.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PackageStatus } from '@prisma/client';

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @IsOptional()
  @IsEnum(PackageStatus, { message: 'Status inválido' })
  status?: PackageStatus;
}
