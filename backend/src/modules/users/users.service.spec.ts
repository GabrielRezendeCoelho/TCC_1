import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/database.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_mock'),
}));

import { Role } from '@prisma/client';

// Mock Implementation focado em Estabilidade (Sem Flakiness)
// O PrismaService é substituído (Dependency Inversion), garantindo que a regra de negócio
// (criptografia de senha, metadados de paginação) seja testada puramente.
const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService (Unitário)', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    // Organização de Módulos para Isolamento (Injeção de Dependências Base)
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Arquitetura e Testabilidade: Isolamento Estrutural', () => {
    it('deve instanciar o serviço de usuários e o Prisma isolado', () => {
      expect(service).toBeDefined();
      expect(prisma).toBeDefined();
    });
  });

  describe('Cenário: Busca de Usuários com Paginação (findAll)', () => {
    it('deve retornar lista de usuários com metadados corretos', async () => {
      // Coerência entre cenário e regra de negócio: a saída da listagem deve formatar dados de metadados
      const mockUsers = [{ id: '1', name: 'Test User' }];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        users: mockUsers,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('Cenário: Busca Única (findOne)', () => {
    it('deve retornar o usuário quando encontrado', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException quando ID não existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      // Validação de tratamento de erros expressivo (Sem verbosidade desnecessária)
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Cenário: Criação de Usuário e Segurança (create)', () => {
    it('deve criptografar a senha corretamente e criar o usuário', async () => {
      // O módulo bcrypt foi mockado globalmente para isolar a regra do fluxo
      const createDto = { 
        name: 'New User', 
        email: 'new@test.com', 
        password: 'plain_password',
        role: Role.DRIVER 
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: '1', email: createDto.email });

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          password: 'hashed_password_mock',
        },
        select: expect.any(Object),
      });
      expect(result).toEqual({ id: '1', email: 'new@test.com' });
    });

    it('deve lançar ConflictException se o e-mail já existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@test.com' });

      await expect(
        service.create({ 
          name: 'Existing', 
          email: 'existing@test.com', 
          password: 'password', 
          role: Role.OPERATOR 
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Cenário: Desativação de Usuário (remove - soft delete)', () => {
    it('deve desativar logicamente o usuário preservando histórico (Boas Práticas)', async () => {
      // Evita duplicação chamando mock interno ou garantindo estado anterior
      const mockUser = { id: '1', name: 'To Remove' };
      prisma.user.findUnique.mockResolvedValue(mockUser); // Simula a busca do usuário no `findOne` chamado pelo `remove`
      prisma.user.update.mockResolvedValue({ id: '1', isActive: false });

      const result = await service.remove('1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });
      expect(result.isActive).toBe(false);
    });
  });
});
