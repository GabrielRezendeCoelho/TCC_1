import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/database.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra um novo usuário com senha hasheada.
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
    });

    return this.generateToken(user.id, user.email, user.role);
  }

  /**
   * Autentica o usuário e retorna um JWT.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    return this.generateToken(user.id, user.email, user.role);
  }

  /**
   * Retorna os dados do perfil do usuário autenticado.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        baseAddress: true,
        baseLat: true,
        baseLng: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Atualiza o perfil do usuário autenticado (nome, endereço base).
   */
  async updateProfile(
    userId: string,
    data: { name?: string; baseAddress?: string; baseLat?: number; baseLng?: number },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        baseAddress: true,
        baseLat: true,
        baseLng: true,
      },
    });
  }

  /**
   * Gera o token JWT com payload padronizado.
   */
  private generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, email, role },
    };
  }
}
