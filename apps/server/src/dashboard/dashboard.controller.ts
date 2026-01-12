import { Controller, Get, UseGuards, Header, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardDto } from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { BypassAuth } from 'src/auth/decorators/bypass-auth.decorator';
import { SystemStatsDto } from './dto/system-stats.dto';
import { PersonalStatsDto } from './dto/personal-stats.dto';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HourlyStatsDto } from './dto/personal-stats.dto';

@Controller('dashboard')
@Versions('1')
@UseGuards(VersionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Get('public')
  @BypassAuth()
  @Header('Cache-Control', 'public, max-age=30')
  async getPublicStats(
    @Query('eventId') eventId?: string,
  ): Promise<PublicStatsDto> {
    return this.dashboardService.getPublicStats(eventId);
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @BypassAuth()
  @Header('Cache-Control', 'public, max-age=30')
  async getDashboardStats(
    @Query('eventId') eventId?: string,
  ): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardStats(eventId);
  }

  @Get('leaderboard')
  @Public()
  @BypassAuth()
  @Header('Cache-Control', 'public, max-age=30')
  async getLeaderboard(
    @Query('eventId') eventId?: string,
  ): Promise<LeaderboardDto> {
    return this.dashboardService.getLeaderboard(eventId);
  }

  @Get('system')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @BypassAuth()
  @Header('Cache-Control', 'no-store')
  async getSystemStats(): Promise<SystemStatsDto> {
    return this.dashboardService.getSystemStats();
  }

  @Get('personal')
  @UseGuards(JwtAuthGuard)
  @BypassAuth()
  @Header('Cache-Control', 'no-store')
  async getPersonalStats(@CurrentUser() user: User): Promise<PersonalStatsDto> {
    return this.dashboardService.getPersonalStats(user.id);
  }

  @Get('hourly-stats')
  @Public()
  @BypassAuth()
  @Header('Cache-Control', 'public, max-age=30')
  async getEventHourlyStats(
    @Query('eventId') eventId: string,
    @Query('date') date?: string,
  ): Promise<HourlyStatsDto[]> {
    return this.dashboardService.getEventHourlyStats(eventId, date);
  }
}
