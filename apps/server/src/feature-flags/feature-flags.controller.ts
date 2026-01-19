import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('system/feature-flags')
@Versions('1')
@UseGuards(VersionGuard, JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  async findAll() {
    return this.featureFlagsService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.MANAGE_SYSTEM) // Only SUPER_ADMIN can manage feature flags
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureFlagsService.findOne(id);
  }

  @Put(':id')
  @Permissions(Permission.MANAGE_SYSTEM) // Only SUPER_ADMIN can manage feature flags
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
    @CurrentUser() user: User,
  ) {
    return this.featureFlagsService.update(id, updateFeatureFlagDto, user.id);
  }
}
