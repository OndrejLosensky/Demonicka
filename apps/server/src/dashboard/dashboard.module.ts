import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { BarrelPredictionModule } from '../barrel-prediction/barrel-prediction.module';

@Module({
  imports: [BarrelPredictionModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
