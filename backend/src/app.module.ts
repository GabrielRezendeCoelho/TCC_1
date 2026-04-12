import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PackagesModule } from './modules/packages/packages.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { RoutesModule } from './modules/routes/routes.module';
import { DeliveryProofsModule } from './modules/delivery-proofs/delivery-proofs.module';
import { OccurrencesModule } from './modules/occurrences/occurrences.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [AuthModule, UsersModule, RolesModule, ClientsModule, DriversModule, VehiclesModule, PackagesModule, TrackingModule, RoutesModule, DeliveryProofsModule, OccurrencesModule, DashboardModule, AuditLogsModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
