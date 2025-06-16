import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { User } from '../users/entities/user.entity';

interface DeviceInfo {
  deviceType?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  isAdminDevice?: boolean;
  isBiometricEnabled?: boolean;
  biometricType?: string;
}

@Injectable()
export class DeviceTokenService {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  async createOrUpdateToken(
    user: User,
    token: string,
    deviceInfo: DeviceInfo,
  ): Promise<DeviceToken> {
    // Check if token already exists
    const existingToken = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (existingToken) {
      // Update existing token
      existingToken.deviceType = deviceInfo.deviceType ?? null;
      existingToken.deviceName = deviceInfo.deviceName ?? null;
      existingToken.deviceModel = deviceInfo.deviceModel ?? null;
      existingToken.osVersion = deviceInfo.osVersion ?? null;
      existingToken.isAdminDevice = deviceInfo.isAdminDevice ?? false;
      existingToken.isBiometricEnabled = deviceInfo.isBiometricEnabled ?? false;
      existingToken.biometricType = deviceInfo.biometricType ?? null;
      existingToken.lastUsed = new Date();

      return this.deviceTokenRepository.save(existingToken);
    }

    // Create new token
    const newDeviceToken = this.deviceTokenRepository.create({
      token,
      userId: user.id,
      deviceType: deviceInfo.deviceType ?? null,
      deviceName: deviceInfo.deviceName ?? null,
      deviceModel: deviceInfo.deviceModel ?? null,
      osVersion: deviceInfo.osVersion ?? null,
      isAdminDevice: deviceInfo.isAdminDevice ?? false,
      isBiometricEnabled: deviceInfo.isBiometricEnabled ?? false,
      biometricType: deviceInfo.biometricType ?? null,
      isActive: true,
      lastUsed: new Date(),
    });

    return this.deviceTokenRepository.save(newDeviceToken);
  }

  async findByToken(token: string): Promise<DeviceToken | null> {
    return this.deviceTokenRepository.findOne({
      where: { token },
    });
  }

  async findByUserId(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { userId },
    });
  }

  async deactivateToken(token: string): Promise<void> {
    await this.deviceTokenRepository.update(
      { token },
      { isActive: false },
    );
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
    token: string,
    enabled: boolean,
    biometricType?: string,
  ): Promise<void> {
    const deviceToken = await this.findByToken(token);
    if (!deviceToken) {
      return;
    }

    deviceToken.isBiometricEnabled = enabled;
    if (biometricType) {
      deviceToken.biometricType = biometricType;
    }

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