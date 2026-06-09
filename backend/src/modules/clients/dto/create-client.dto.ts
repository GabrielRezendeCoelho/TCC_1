import { IsNotEmpty, IsString } from 'class-validator';
import { IsCpfOrCnpj } from '../../../common/decorators';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'Documento (CPF/CNPJ) é obrigatório' })
  @IsCpfOrCnpj({ message: 'O documento informado não é um CPF ou CNPJ válido' })
  document: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  userId: string;
}
