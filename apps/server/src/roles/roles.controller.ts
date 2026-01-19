import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('system/roles')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions(Permission.MANAGE_SYSTEM)
  async findAll() {
    const roles = await this.rolesService.findAll();
    const allPermissions = await this.rolesService.findAllPermissions();
    return {
      roles,
      allPermissions,
    };
  }

  @Get(':id')
  @Permissions(Permission.MANAGE_SYSTEM)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id/permissions')
  @Permissions(Permission.MANAGE_SYSTEM)
  async updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRolePermissionsDto: UpdateRolePermissionsDto,
    @CurrentUser() user: User,
  ) {
    return this.rolesService.updatePermissions(
      id,
      updateRolePermissionsDto.permissionIds,
      user.id,
    );
  }
}
