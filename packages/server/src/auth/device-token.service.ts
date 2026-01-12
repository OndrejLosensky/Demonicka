import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken, DeviceType } from './entities/device-token.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DeviceTokenService {
  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  async createOrUpdateToken(
    user: User,
    token: string,
    deviceInfo: {
      deviceType: DeviceType;
      deviceName: string | null;
      deviceModel?: string | null;
      osVersion?: string | null;
      isAdminDevice?: boolean;
    },
  ): Promise<DeviceToken> {
    // Check if device token already exists
    const existingToken = await this.deviceTokenRepository.findOne({
      where: { token, userId: user.id },
    });

    if (existingToken) {
      // Update existing token
      existingToken.lastUsed = new Date();
      existingToken.isActive = true;
      existingToken.deviceName = deviceInfo.deviceName;
      existingToken.deviceModel = deviceInfo.deviceModel ?? null;
      existingToken.osVersion = deviceInfo.osVersion ?? null;
      existingToken.isAdminDevice = deviceInfo.isAdminDevice ?? false;

      return this.deviceTokenRepository.save(existingToken);
    }

    // Create new token
    const newDeviceToken = this.deviceTokenRepository.create({
      userId: user.id,
      token,
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName,
      deviceModel: deviceInfo.deviceModel ?? null,
      osVersion: deviceInfo.osVersion ?? null,
      isAdminDevice: deviceInfo.isAdminDevice ?? false,
      lastUsed: new Date(),
    });

    return this.deviceTokenRepository.save(newDeviceToken);
  }

  async deactivateToken(userId: string, token: string): Promise<void> {
    const deviceToken = await this.deviceTokenRepository.findOne({
      where: { token, userId },
    });

    if (!deviceToken) {
      throw new NotFoundException('Device token not found');
    }

    deviceToken.isActive = false;
    await this.deviceTokenRepository.save(deviceToken);
  }

  async deactivateAllUserTokens(userId: string): Promise<void> {
    await this.deviceTokenRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async getActiveDevices(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { userId, isActive: true },
      order: { lastUsed: 'DESC' },
    });
  }

  async updateBiometricStatus(
    userId: string,
    token: string,
    enabled: boolean,
  ): Promise<void> {
    const deviceToken = await this.deviceTokenRepository.findOne({
      where: { token, userId },
    });

    if (!deviceToken) {
      throw new NotFoundException('Device token not found');
    }

    deviceToken.biometricEnabled = enabled;
    await this.deviceTokenRepository.save(deviceToken);
  }

  async validateDeviceToken(
    userId: string,
    token: string,
    requireAdmin = false,
  ): Promise<boolean> {
    const deviceToken = await this.deviceTokenRepository.findOne({
      where: { token, userId, isActive: true },
    });

    if (!deviceToken) {
      return false;
    }

    if (requireAdmin && !deviceToken.isAdminDevice) {
      return false;
    }

    deviceToken.lastUsed = new Date();
    await this.deviceTokenRepository.save(deviceToken);

    return true;
  }
} 