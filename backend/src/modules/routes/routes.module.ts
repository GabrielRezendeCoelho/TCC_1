import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { RouteOptimizerService } from './services/route-optimizer.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutesService, RouteOptimizerService],
  exports: [RoutesService],
})
export class RoutesModule {}
