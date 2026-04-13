import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

// Mock do módulo bcrypt utilizando Jest global (Best Practice para prevenir redefinições)
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService (Unitário)', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: Role.DRIVER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(), // AuthService utiliza jwtService.sign (sync)
  };

  beforeEach(async () => {
    // Isolamento estrutural estrito utilizando Dependency Inversion
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenário: Registro de Usuário (register)', () => {
    it('deve registrar usuário com hash e devolver o token JWT gerado', async () => {
      const dto = { name: 'Novo', email: 'novo@test.com', password: '123', role: Role.OPERATOR };
      
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_123');
      mockPrismaService.user.create.mockResolvedValue({ id: 'user-2', ...dto, password: 'hashed_123' });
      mockJwtService.sign.mockReturnValue('jwt-token-novo');

      const result = await authService.register(dto);

      expect(prismaService.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
      expect(result.accessToken).toBe('jwt-token-novo');
    });

    it('deve lançar ConflictException se o email já estiver em uso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.register({ name: 'A', email: 'test@example.com', password: 'B' })).rejects.toThrow(ConflictException);
    });
  });

  describe('Cenário: Autenticação de Usuário (login)', () => {
    it('deve retornar um accessToken e o usuário em caso de credenciais corretas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('fake-jwt-token');

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
      
      expect(result).toEqual({
        accessToken: 'fake-jwt-token',
        user: { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      });
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({ email: 'wrong@example.com', password: 'password' })).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se a senha for incorreta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ email: 'test@example.com', password: 'wrongpassword' })).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
