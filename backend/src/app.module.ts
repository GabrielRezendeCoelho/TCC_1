import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Configurações tipadas
import { appConfig, jwtConfig } from './config';

// Camada de banco de dados
import { DatabaseModule } from './database/database.module';

// Guards globais
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Módulos MVP
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PackagesModule } from './modules/packages/packages.module';
import { RoutesModule } from './modules/routes/routes.module';
import { DriversModule } from './modules/drivers/drivers.module';

@Module({
  imports: [
    // Carrega variáveis de ambiente globalmente
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
    }),

    // Banco de dados (PrismaService global)
    DatabaseModule,

    // Módulos de domínio do MVP
    AuthModule,
    UsersModule,
    RolesModule,
    PackagesModule,
    RoutesModule,
    DriversModule,
  ],
  providers: [
    // Guard JWT global — todos os endpoints exigem autenticação
    // exceto os marcados com @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Guard de roles global — verifica permissões via @Roles()
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
