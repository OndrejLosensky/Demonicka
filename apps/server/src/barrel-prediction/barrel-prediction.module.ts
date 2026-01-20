import { Module } from '@nestjs/common';
import { BarrelPredictionService } from './barrel-prediction.service';

@Module({
  providers: [BarrelPredictionService],
  exports: [BarrelPredictionService],
})
export class BarrelPredictionModule {}

