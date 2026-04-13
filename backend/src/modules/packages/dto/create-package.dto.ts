import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do destinatário é obrigatório' })
  recipientName: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  address: string;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude deve ser um número' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude deve ser um número' })
  longitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Peso deve ser um número' })
  weight?: number;

  @IsString()
  @IsNotEmpty({ message: 'ID do cliente remetente é obrigatório' })
  clientId: string;
}
