import { Module } from '@nestjs/common';
import { VersionGuard } from './guards/version.guard';

@Module({
  providers: [VersionGuard],
  exports: [VersionGuard],
})
export class VersioningModule {}
