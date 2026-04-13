import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');

  // CORS para o frontend web
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  // Validação automática de DTOs via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Tratamento padronizado de erros
  app.useGlobalFilters(new HttpExceptionFilter());

  // Resposta padronizada para sucesso
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
