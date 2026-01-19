import { Module } from '@nestjs/common';
import { BeerPongDefaultsController } from './beer-pong-defaults.controller';
import { BeerPongDefaultsService } from './beer-pong-defaults.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  controllers: [BeerPongDefaultsController],
  providers: [BeerPongDefaultsService],
  exports: [BeerPongDefaultsService],
})
export class BeerPongDefaultsModule {}
