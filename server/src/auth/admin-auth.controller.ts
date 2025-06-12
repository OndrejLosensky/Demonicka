import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeviceTokenService } from './device-token.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Controller('api/v1/auth/admin')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() adminLoginDto: AdminLoginDto) {
    // Validate user credentials
    const userWithoutPassword = await this.authService.validateUser(
      adminLoginDto.username,
      adminLoginDto.password,
    );

    // Get full user object
    const user = await this.usersService.findOne(userWithoutPassword.id);

    // Check if user is an admin
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admin users can access this endpoint');
    }

    // Check if admin login is enabled for this user
    if (!user.isAdminLoginEnabled) {
      throw new UnauthorizedException('Admin login is not enabled for this user');
    }

    // Validate 2FA if enabled
    if (user.isTwoFactorEnabled) {
      if (!adminLoginDto.twoFactorCode) {
        return {
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required',
        };
      }
      // TODO: Implement 2FA code validation
    }

    // Generate tokens
    const { access_token, refresh_token } = await this.authService.login(userWithoutPassword);

    // Register or update device token
    await this.deviceTokenService.createOrUpdateToken(user, adminLoginDto.deviceToken, {
      deviceType: adminLoginDto.deviceType,
      deviceName: adminLoginDto.deviceName,
      deviceModel: adminLoginDto.deviceModel,
      osVersion: adminLoginDto.osVersion,
      isAdminDevice: true,
    });

    // Update last admin login time
    user.lastAdminLogin = new Date();
    await this.usersService.update(user.id, { lastAdminLogin: user.lastAdminLogin });

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async logout(@Req() req: Request) {
    const user = req.user as { id: string };
    const deviceToken = req.headers['x-device-token'] as string;

    if (deviceToken) {
      await this.deviceTokenService.deactivateToken(user.id, deviceToken);
    }

    return { message: 'Logged out successfully' };
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDevices(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.deviceTokenService.getActiveDevices(user.id);
  }

  @Post('devices/logout-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async logoutAllDevices(@Req() req: Request) {
    const user = req.user as { id: string };
    await this.deviceTokenService.deactivateAllUserTokens(user.id);
    return { message: 'Logged out from all devices' };
  }

  @Post('biometric')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateBiometricStatus(
    @Req() req: Request,
    @Body() body: { enabled: boolean },
  ) {
    const user = req.user as { id: string };
    const deviceToken = req.headers['x-device-token'] as string;

    if (!deviceToken) {
      throw new UnauthorizedException('Device token is required');
    }

    await this.deviceTokenService.updateBiometricStatus(
      user.id,
      deviceToken,
      body.enabled,
    );

    return { message: 'Biometric status updated successfully' };
  }
} 