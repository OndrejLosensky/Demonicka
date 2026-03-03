import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import type { User } from '@prisma/client';

@Controller('feedback')
@Versions('1')
@UseGuards(VersionGuard, JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateFeedbackDto,
  ) {
    const feedback = await this.feedbackService.create(user.id, dto);
    return { id: feedback.id };
  }
}
