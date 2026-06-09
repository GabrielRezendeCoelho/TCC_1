import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { ROUTE_OPTIMIZER_TOKEN } from './interfaces/route-optimizer.interface';
import { LockedLoggerService } from '../../common/interceptors';

@Module({
  controllers: [RoutesController],
  providers: [
    RoutesService,
    LockedLoggerService,
    {
      provide: ROUTE_OPTIMIZER_TOKEN,
      useClass: RouteOptimizerService,
    },
  ],
  exports: [RoutesService],
})
export class RoutesModule {}
