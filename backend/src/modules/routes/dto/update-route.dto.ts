import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteDto } from './create-route.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RouteStatus } from '@prisma/client';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {
  @IsOptional()
  @IsEnum(RouteStatus, { message: 'Status de rota inválido' })
  status?: RouteStatus;

  @IsOptional()
  @IsUUID('4', { message: 'ID do motorista deve ser UUID válido' })
  driverId?: string;
}
