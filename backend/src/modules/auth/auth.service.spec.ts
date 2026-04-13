import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

// Mock do módulo bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
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
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
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

  describe('login', () => {
    it('deve retornar um accessToken e o usuário em caso de credenciais corretas', async () => {
      // Configuração dos mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('fake-jwt-token');

      // Execução
      const result = await authService.login('test@example.com', 'password123');

      // Validação
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
      expect(result).toEqual({
        accessToken: 'fake-jwt-token',
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role },
      });
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('wrong@example.com', 'password')).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se a senha for incorreta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
