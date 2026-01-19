import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { BeerPongDefaultsService } from './beer-pong-defaults.service';
import { UpdateBeerPongDefaultsDto } from './dto/update-beer-pong-defaults.dto';

@Controller('system/beer-pong-defaults')
@Versions('1')
@UseGuards(VersionGuard, JwtAuthGuard)
@Permissions(Permission.MANAGE_SYSTEM)
export class BeerPongDefaultsController {
  constructor(private readonly defaults: BeerPongDefaultsService) {}

  @Get()
  async get() {
    return this.defaults.get();
  }

  @Put()
  async update(
    @Body() dto: UpdateBeerPongDefaultsDto,
    @CurrentUser() user: User,
  ) {
    return this.defaults.update(dto, user.id);
  }
}
