import { Controller, Get, UseGuards, Header } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardDto } from './dto/leaderboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
