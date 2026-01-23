import { Body, Controller, Get, Put, UseGuards, Header } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { User } from '@prisma/client';
import { LeaderboardViewSettingsService } from './leaderboard-view-settings.service';
import { UpdateLeaderboardViewSettingsDto } from './dto/update-leaderboard-view-settings.dto';

@Controller('leaderboard-view-settings')
@Versions('1')
@UseGuards(VersionGuard)
export class LeaderboardViewSettingsController {
  constructor(private readonly settings: LeaderboardViewSettingsService) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'public, max-age=30')
  async get() {
    return this.settings.get();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Permissions(Permission.MANAGE_SYSTEM)
  async update(
    @Body() dto: UpdateLeaderboardViewSettingsDto,
    @CurrentUser() user: User,
  ) {
    return this.settings.update(dto, user.id);
  }
}
