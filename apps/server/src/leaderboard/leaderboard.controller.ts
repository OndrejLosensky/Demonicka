import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardGateway } from './leaderboard.gateway';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from "@prisma/client"';
import { LeaderboardDto } from '../dashboard/dto/leaderboard.dto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  @Get()
  @Public()
  getLeaderboard(
    @Query('eventId') eventId?: string,
  ): Promise<LeaderboardDto> {
    return this.leaderboardService.getLeaderboard(eventId);
  }

  @Post('test-update')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  async testWebSocketUpdate(@Query('eventId') eventId?: string) {
    await this.leaderboardGateway.emitFullUpdate(eventId);
    return { message: 'WebSocket update triggered successfully' };
  }
} 