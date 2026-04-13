import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty({ message: 'Número da CNH é obrigatório' })
  licenseNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  userId: string;
}
