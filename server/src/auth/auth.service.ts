import { Injectable, UnauthorizedException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { DeviceToken } from './entities/device-token.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

interface LoginOptions {
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  biometricEnabled?: boolean;
  biometricType?: string;
}

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  public getCookieOptions(isRefreshToken = false) {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(
        Date.now() +
          (isRefreshToken ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000),
      ),
    };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByUsername(username);
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ user: Omit<User, 'password'> }> {
    const user = await this.usersService.create(createUserDto);
    return { user };
  }

  async login(
    user: UserWithoutPassword,
    options?: LoginOptions,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserWithoutPassword;
  }> {
    // Create or update device token if device info is provided
    let deviceToken: DeviceToken | null = null;
    if (options?.deviceId) {
      deviceToken = await this.deviceTokenRepository.findOne({
        where: { id: options.deviceId },
      });

      if (!deviceToken) {
        deviceToken = this.deviceTokenRepository.create({
          userId: user.id,
          deviceType: options.deviceType,
          deviceName: options.deviceName,
          deviceModel: options.deviceModel,
          osVersion: options.osVersion,
          isBiometricEnabled: options.biometricEnabled,
          biometricType: options.biometricType,
          isActive: true,
          lastUsed: new Date(),
        });
      } else {
        deviceToken.lastUsed = new Date();
        if (options.biometricEnabled !== undefined) {
          deviceToken.isBiometricEnabled = options.biometricEnabled;
        }
        if (options.biometricType) {
          deviceToken.biometricType = options.biometricType;
        }
      }
      await this.deviceTokenRepository.save(deviceToken);
    }

    // Create JWT payload with device info
    const payload = {
      username: user.username,
      sub: user.id,
      deviceId: deviceToken?.id,
    };

    const access_token = await this.jwtService.signAsync(payload);
    const refreshToken = await this.createRefreshToken(user.id, deviceToken?.id);

    return {
      access_token,
      refresh_token: refreshToken.token,
      user,
    };
  }

  async logout(response: Response): Promise<void> {
    response.clearCookie('refresh_token', this.getCookieOptions(true));
  }

  async refreshTokens(refreshTokenStr: string, deviceId?: string) {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { 
        token: refreshTokenStr,
        ...(deviceId && { deviceId })
      },
      relations: ['user'],
    });

    if (!refreshToken || refreshToken.isRevoked || new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update device last used time if device ID is provided
    if (deviceId) {
      const deviceToken = await this.deviceTokenRepository.findOne({
        where: { id: deviceId },
      });
      if (deviceToken) {
        deviceToken.lastUsed = new Date();
        await this.deviceTokenRepository.save(deviceToken);
      }
    }

    // Generate new tokens
    const payload = { 
      sub: user.id, 
      username: user.username,
      deviceId: deviceId
    };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.createRefreshToken(user.id, deviceId);

    // Revoke old refresh token
    await this.revokeRefreshToken(refreshToken.id, 'Refreshed');

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  private async createRefreshToken(userId: string, deviceId?: string): Promise<RefreshToken> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      deviceId,
      expiresAt,
      token: await this.generateRefreshToken(),
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  private async generateRefreshToken(): Promise<string> {
    const bytes = await bcrypt.genSalt(16);
    return bytes.replace(/[^a-zA-Z0-9]/g, '');
  }

  async revokeRefreshToken(tokenId: string, reason: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, {
      isRevoked: true,
      revokedReason: reason,
    });
  }

  async validateRefreshToken(token: string, userId: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token, userId },
    });

    if (!refreshToken || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  async validateBiometricAuth(userId: string, deviceId: string): Promise<boolean> {
    const deviceToken = await this.deviceTokenRepository.findOne({
      where: { id: deviceId, userId, isActive: true },
    });

    return deviceToken?.isBiometricEnabled ?? false;
  }
}
