import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Public } from '../auth/decorators/public.decorator';
import { LeaderboardDto } from '../dashboard/dto/leaderboard.dto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @Public()
  getLeaderboard(
    @Query('eventId') eventId?: string,
  ): Promise<LeaderboardDto> {
    return this.leaderboardService.getLeaderboard(eventId);
  }
} 