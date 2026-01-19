import {
  Controller,
  Get,
  UseGuards,
  Header,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardDto } from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { SystemStatsDto } from './dto/system-stats.dto';
import { PersonalStatsDto } from './dto/personal-stats.dto';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HourlyStatsDto } from './dto/personal-stats.dto';
import type {
  UserDashboardEventBeerPongDto,
  UserDashboardEventDetailDto,
  UserDashboardEventListDto,
  UserDashboardOverviewDto,
} from './dto/user-dashboard.dto';

@Controller('dashboard')
@Versions('1')
@UseGuards(VersionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Get('public')
  @Header('Cache-Control', 'public, max-age=30')
  async getPublicStats(
    @Query('eventId') eventId?: string,
  ): Promise<PublicStatsDto> {
    return this.dashboardService.getPublicStats(eventId);
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'public, max-age=30')
  async getDashboardStats(
    @Query('eventId') eventId?: string,
  ): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardStats(eventId);
  }

  @Get('leaderboard')
  @Public()
  @Header('Cache-Control', 'public, max-age=30')
  async getLeaderboard(
    @Query('eventId') eventId?: string,
  ): Promise<LeaderboardDto> {
    return this.dashboardService.getLeaderboard(eventId);
  }

  @Get('system')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  @Header('Cache-Control', 'no-store')
  async getSystemStats(): Promise<SystemStatsDto> {
    return this.dashboardService.getSystemStats();
  }

  @Get('personal')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getPersonalStats(@CurrentUser() user: User): Promise<PersonalStatsDto> {
    return this.dashboardService.getPersonalStats(user.id);
  }

  @Get('hourly-stats')
  @Public()
  @Header('Cache-Control', 'public, max-age=30')
  async getEventHourlyStats(
    @Query('eventId') eventId: string,
    @Query('date') date?: string,
  ): Promise<HourlyStatsDto[]> {
    return this.dashboardService.getEventHourlyStats(eventId, date);
  }

  @Get('user/overview')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getUserOverview(
    @CurrentUser() user: User,
    @Query('username') username?: string,
  ): Promise<UserDashboardOverviewDto> {
    const target = await this.dashboardService.resolveDashboardTargetUser(
      username,
      user,
    );
    return this.dashboardService.getUserDashboardOverview(target.id);
  }

  @Get('user/events')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getUserEvents(
    @CurrentUser() user: User,
    @Query('username') username?: string,
  ): Promise<UserDashboardEventListDto> {
    const target = await this.dashboardService.resolveDashboardTargetUser(
      username,
      user,
    );
    return this.dashboardService.getUserDashboardEvents(target.id);
  }

  @Get('user/events/:eventId')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getUserEventDetail(
    @CurrentUser() user: User,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('username') username?: string,
  ): Promise<UserDashboardEventDetailDto> {
    const target = await this.dashboardService.resolveDashboardTargetUser(
      username,
      user,
    );
    return this.dashboardService.getUserDashboardEventDetail(
      target.id,
      eventId,
    );
  }

  @Get('user/events/:eventId/beer-pong')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async getUserEventBeerPong(
    @CurrentUser() user: User,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('username') username?: string,
  ): Promise<UserDashboardEventBeerPongDto> {
    const target = await this.dashboardService.resolveDashboardTargetUser(
      username,
      user,
    );
    return this.dashboardService.getUserDashboardEventBeerPong(
      target.id,
      eventId,
    );
  }
}
