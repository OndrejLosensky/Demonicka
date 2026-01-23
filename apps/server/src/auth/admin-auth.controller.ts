import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
  Get,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeviceTokenService } from './device-token.service';
import { TwoFactorService } from './two-factor.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth/admin')
@Versions('1')
@UseGuards(VersionGuard)
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly usersService: UsersService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() adminLoginDto: AdminLoginDto) {
    // Validate user credentials
    const userWithoutPassword = await this.authService.validateUser(
      adminLoginDto.username,
      adminLoginDto.password,
    );

    // Check if user exists
    if (!userWithoutPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get full user object
    const user = await this.usersService.findOne(userWithoutPassword.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is an operator or super admin
    if (user.role !== UserRole.OPERATOR && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only operator or super admin users can access this endpoint',
      );
    }

    // Check if user can login
    if (!user.canLogin) {
      throw new UnauthorizedException('Login is not enabled for this user');
    }

    // Validate 2FA if enabled
    if (user.isTwoFactorEnabled) {
      if (!adminLoginDto.twoFactorCode) {
        // Generate and send code
        try {
          await this.twoFactorService.generateAndSendCode(user.id);
          return {
            requiresTwoFactor: true,
            message: 'Two-factor authentication code required',
          };
        } catch (error) {
          throw new BadRequestException(
            'Failed to send two-factor authentication code',
          );
        }
      }

      // Validate 2FA code
      const isValid = await this.twoFactorService.validateCode(
        user.id,
        adminLoginDto.twoFactorCode,
      );
      if (!isValid) {
        throw new UnauthorizedException(
          'Invalid or expired two-factor authentication code',
        );
      }
    }

    // Generate tokens
    const { access_token, refresh_token } =
      await this.authService.login(userWithoutPassword);

    // Register or update device token
    await this.deviceTokenService.createOrUpdateToken(
      user,
      adminLoginDto.deviceToken,
      {
        deviceType: adminLoginDto.deviceType,
        deviceName: adminLoginDto.deviceName,
        deviceModel: adminLoginDto.deviceModel,
        osVersion: adminLoginDto.osVersion,
        isAdminDevice: true,
      },
    );

    // Update last admin login time
    user.lastAdminLogin = new Date();
    await this.usersService.update(user.id, {
      lastAdminLogin: user.lastAdminLogin,
    });

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async getDevices(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.deviceTokenService.getActiveDevices(user.id);
  }

  @Post('devices/logout-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async logoutAllDevices(@Req() req: Request) {
    const user = req.user as { id: string };
    await this.deviceTokenService.deactivateAllUserTokens(user.id);
    return { message: 'Logged out from all devices' };
  }

  @Post('biometric')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
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
