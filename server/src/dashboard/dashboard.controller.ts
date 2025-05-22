import { Controller, Get, UseGuards, Header } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardDto } from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

@Controller('dashboard')
@Versions('1')
@UseGuards(VersionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Get('public')
  @Header('Cache-Control', 'public, max-age=30')
  async getPublicStats(): Promise<PublicStatsDto> {
    return this.dashboardService.getPublicStats();
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'public, max-age=30')
  async getDashboardStats(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardStats();
  }

  @Get('leaderboard')
  @Header('Cache-Control', 'public, max-age=30')
  async getLeaderboard(): Promise<LeaderboardDto> {
    return this.dashboardService.getLeaderboard();
  }
}
