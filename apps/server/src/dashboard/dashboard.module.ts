import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { BarrelPredictionModule } from '../barrel-prediction/barrel-prediction.module';
import { EventPaceModule } from '../event-pace/event-pace.module';

@Module({
  imports: [BarrelPredictionModule, EventPaceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
