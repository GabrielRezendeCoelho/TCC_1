import { IsNotEmpty, IsString } from 'class-validator';
import { IsCpfOrCnpj } from '../../../common/decorators';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty({ message: 'Número da CNH é obrigatório' })
  @IsCpfOrCnpj({ message: 'CPF inválido' })
  licenseNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  userId: string;
}
