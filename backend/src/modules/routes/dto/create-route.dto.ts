import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da rota é obrigatório' })
  name: string;

  @IsDateString({}, { message: 'Data deve estar no formato ISO' })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  date: string;

  @IsOptional()
  @IsString()
  startAddress?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de pacotes devem ser UUIDs válidos' })
  packageIds?: string[];
}
