import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EventDetailDataLoader } from './event-detail/EventDetailDataLoader';
import { EventDetailExportBuilder } from './event-detail/EventDetailExportBuilder';
import { SystemExportBuilder } from './system/SystemExportBuilder';
import { UsersExportBuilder } from './users/UsersExportBuilder';

@Module({
  imports: [DashboardModule],
  providers: [
    EventDetailDataLoader,
    EventDetailExportBuilder,
    SystemExportBuilder,
    UsersExportBuilder,
  ],
  exports: [
    EventDetailExportBuilder,
    EventDetailDataLoader,
    SystemExportBuilder,
    UsersExportBuilder,
  ],
})
export class ExportsModule {}
