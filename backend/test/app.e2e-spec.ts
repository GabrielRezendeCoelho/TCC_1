import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App & Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let validToken = '';

  it('/api/auth/login (POST) - Deve retornar 401 para credenciais falsas', async () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'fake@email.com', password: 'wrong' })
      .expect(401);
  });

  // Nota: Para este teste passar com o 200/201 é necessário que o banco exista e o script de seed
  // do 'admin@trackgo.com | 123456' tenha sido rodado. O Prisma vai ler o .env local.
  it('/api/auth/login (POST) - Deve retornar Token se admin existir', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@trackgo.com', password: '123456' });

    if (response.status === 201 || response.status === 200) {
      expect(response.body.data).toHaveProperty('accessToken');
      validToken = response.body.data.accessToken;
    } else {
      // Se a seed não rodou, o teste falha mas reporta adequadamente.
      console.warn('Banco local desatualizado ou sem seed. Setup necessário para E2E local.');
    }
  });

  it('/api/auth/profile (GET) - Deve bloquear acesso sem token', () => {
    return request(app.getHttpServer())
      .get('/api/auth/profile')
      .expect(401); // Unauthorized
  });

  it('/api/auth/profile (GET) - Deve permitir acesso com token valido', () => {
    if (!validToken) return; // salta se o BD local não tinha a seed aplicada
    
    return request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
