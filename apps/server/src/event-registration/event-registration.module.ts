import { Module } from '@nestjs/common';
import { EventRegistrationService } from './event-registration.service';
import { UserMatchingService } from './user-matching.service';
import { RegistrationPublicController } from './registration-public.controller';
import { RegistrationReviewController } from './registration-review.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegistrationPublicController, RegistrationReviewController],
  providers: [EventRegistrationService, UserMatchingService],
  exports: [EventRegistrationService, UserMatchingService],
})
export class EventRegistrationModule {}
