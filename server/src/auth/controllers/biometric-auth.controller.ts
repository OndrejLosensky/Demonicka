import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../auth.service';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Versions } from '../../versioning/decorators/version.decorator';
import { VersionGuard } from '../../versioning/guards/version.guard';

interface BiometricAuthDto {
  deviceId: string;
  biometricType: string;
}

@Controller('auth/biometric')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class BiometricAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('enable')
  async enableBiometric(
    @GetUser() user: User,
    @Body() biometricAuthDto: BiometricAuthDto,
  ) {
    const { deviceId, biometricType } = biometricAuthDto;
    
    // Login with biometric enabled to get new tokens
    return this.authService.login(user, {
      deviceId,
      biometricType,
      biometricEnabled: true,
    });
  }

  @Post('disable')
  async disableBiometric(
    @GetUser() user: User,
    @Body() { deviceId }: { deviceId: string },
  ) {
    // Login with biometric disabled to get new tokens
    return this.authService.login(user, {
      deviceId,
      biometricEnabled: false,
    });
  }

  @Get('status/:deviceId')
  async getBiometricStatus(
    @GetUser() user: User,
    @Param('deviceId') deviceId: string,
  ) {
    const isEnabled = await this.authService.validateBiometricAuth(
      user.id,
      deviceId,
    );
    return { isEnabled };
  }

  @Post('authenticate')
  async authenticateWithBiometric(
    @Body() { deviceId }: { deviceId: string },
    @GetUser() user: User,
  ) {
    const isValid = await this.authService.validateBiometricAuth(
      user.id,
      deviceId,
    );

    if (!isValid) {
      throw new UnauthorizedException('Biometric authentication is not enabled for this device');
    }

    // Generate new tokens after successful biometric auth
    return this.authService.login(user, { deviceId });
  }
} 