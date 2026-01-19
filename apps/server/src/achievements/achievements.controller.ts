import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import {
  UserAchievementsResponseDto,
  CreateAchievementDto,
  UpdateAchievementDto,
  AchievementDto,
} from './dto/achievement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('achievements')
@Versions('1')
@UseGuards(VersionGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyAchievements(
    @CurrentUser() user: User,
  ): Promise<UserAchievementsResponseDto> {
    return this.achievementsService.getUserAchievements(user.id);
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  async checkAchievements(@CurrentUser() user: User): Promise<void> {
    await this.achievementsService.checkAndUpdateAchievements(user.id);
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async getAllAchievements(): Promise<AchievementDto[]> {
    return this.achievementsService.getAllAchievements();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async createAchievement(
    @Body() createDto: CreateAchievementDto,
  ): Promise<AchievementDto> {
    return this.achievementsService.createAchievement(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async updateAchievement(
    @Param('id') id: string,
    @Body() updateDto: UpdateAchievementDto,
  ): Promise<AchievementDto> {
    return this.achievementsService.updateAchievement(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async deleteAchievement(@Param('id') id: string): Promise<void> {
    await this.achievementsService.deleteAchievement(id);
  }
}
