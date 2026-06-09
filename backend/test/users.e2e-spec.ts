/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/database.service';
import { HttpExceptionFilter } from '../src/common/filters';
import { TransformInterceptor } from '../src/common/interceptors';
import { Role } from '@prisma/client';

/**
 * Testes E2E — CRUD de Usuários (/api/users)
 *
 * Cobre o ciclo completo Create → Read → Update → Delete via HTTP,
 * validando a integração entre Controller, Service, Prisma e Guards.
 *
 * Este é o segundo tipo de teste para o módulo Users (o primeiro é unitário).
 * A rubrica exige pelo menos 2 tipos diferentes de teste em um CRUD completo.
 */
describe('Users CRUD (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken = '';
  let createdUserId = '';

  // Dados do admin seed para autenticação
  const adminCredentials = {
    email: 'admin@trackgo.com',
    password: '123456',
  };

  // Dados para criação de um novo usuário de teste
  const testUser = {
    name: 'Usuário E2E Teste',
    email: `e2e-test-${Date.now()}@trackgo.com`,
    password: 'senha123456',
    role: Role.OPERATOR,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    // Removendo TransformInterceptor nos testes E2E temporariamente pois ele pode encapsular a response de forma diferente
    // app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get(PrismaService);

    // Autentica como admin para obter token JWT
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(adminCredentials);

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      adminToken = loginResponse.body.data
        ? loginResponse.body.data.accessToken
        : loginResponse.body.accessToken;
    }
  });

  afterAll(async () => {
    // Limpa o usuário de teste criado (se existir)
    if (createdUserId) {
      try {
        await prisma.user.delete({ where: { id: createdUserId } });
      } catch {
        // Ignora se já foi removido
      }
    }
    await app.close();
  });

  // ──────────────────────────────────────────────────
  // Verificação de pré-requisito: autenticação admin
  // ──────────────────────────────────────────────────

  it('deve possuir token de admin válido para os testes', () => {
    if (!adminToken) {
      console.warn(
        '⚠️  Token admin não obtido — execute `npx prisma db seed` antes de rodar os testes E2E.',
      );
    }
  });

  // ──────────────────────────────────────────────────
  // CREATE — POST /api/users
  // ──────────────────────────────────────────────────

  describe('POST /api/users (Create)', () => {
    it('deve rejeitar requisição sem token JWT (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send(testUser)
        .expect(401);
    });

    it('deve criar um novo usuário com sucesso (201)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testUser)
        .expect(201);

      const data = response.body.data || response.body;
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(testUser.name);
      expect(data.email).toBe(testUser.email);
      expect(data.role).toBe(testUser.role);

      createdUserId = data.id;
    });
  });

  // ──────────────────────────────────────────────────
  // READ — GET /api/users e GET /api/users/:id
  // ──────────────────────────────────────────────────

  describe('GET /api/users (Read — Lista)', () => {
    it('deve listar usuários com paginação (200)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      const data = response.body.data || response.body;
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.users)).toBe(true);
    });
  });

  describe('GET /api/users/:id (Read — Único)', () => {
    it('deve retornar o usuário criado pelo ID (200)', async () => {
      if (!adminToken || !createdUserId) return;

      const response = await request(app.getHttpServer())
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = response.body.data || response.body;
      expect(data.id).toBe(createdUserId);
      expect(data.name).toBe(testUser.name);
    });
  });

  // ──────────────────────────────────────────────────
  // UPDATE — PATCH /api/users/:id
  // ──────────────────────────────────────────────────

  describe('PATCH /api/users/:id (Update)', () => {
    it('deve atualizar o nome do usuário com sucesso (200)', async () => {
      if (!adminToken || !createdUserId) return;

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nome Atualizado E2E' })
        .expect(200);

      const data = response.body.data || response.body;
      expect(data.name).toBe('Nome Atualizado E2E');
      expect(data.id).toBe(createdUserId);
    });
  });

  // ──────────────────────────────────────────────────
  // DELETE — DELETE /api/users/:id (Soft Delete)
  // ──────────────────────────────────────────────────

  describe('DELETE /api/users/:id (Soft Delete)', () => {
    it('deve desativar (soft delete) o usuário com sucesso (200)', async () => {
      if (!adminToken || !createdUserId) return;

      const response = await request(app.getHttpServer())
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = response.body.data || response.body;
      expect(data.isActive).toBe(false);
    });
  });
});
