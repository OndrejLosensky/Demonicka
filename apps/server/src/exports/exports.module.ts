import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EventDetailDataLoader } from './event-detail/EventDetailDataLoader';
import { EventDetailExportBuilder } from './event-detail/EventDetailExportBuilder';
 
@Module({
  imports: [DashboardModule],
  providers: [EventDetailDataLoader, EventDetailExportBuilder],
  exports: [EventDetailExportBuilder],
})
export class ExportsModule {}

