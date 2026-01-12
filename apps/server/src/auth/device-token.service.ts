import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceToken, DeviceType } from '@prisma/client';
import { User } from '@prisma/client';

@Injectable()
export class DeviceTokenService {
  constructor(private prisma: PrismaService) {}

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
    const existingToken = await this.prisma.deviceToken.findFirst({
      where: { token, userId: user.id },
    });

    if (existingToken) {
      // Update existing token
      return this.prisma.deviceToken.update({
        where: { id: existingToken.id },
        data: {
          lastUsed: new Date(),
          isActive: true,
          deviceName: deviceInfo.deviceName,
          deviceModel: deviceInfo.deviceModel ?? null,
          osVersion: deviceInfo.osVersion ?? null,
          isAdminDevice: deviceInfo.isAdminDevice ?? false,
        },
      });
    }

    // Create new token
    return this.prisma.deviceToken.create({
      data: {
        userId: user.id,
        token,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel ?? null,
        osVersion: deviceInfo.osVersion ?? null,
        isAdminDevice: deviceInfo.isAdminDevice ?? false,
        lastUsed: new Date(),
      },
    });
  }

  async deactivateToken(userId: string, token: string): Promise<void> {
    const deviceToken = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
    });

    if (!deviceToken) {
      throw new NotFoundException('Device token not found');
    }

    await this.prisma.deviceToken.update({
      where: { id: deviceToken.id },
      data: { isActive: false },
    });
  }

  async deactivateAllUserTokens(userId: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  async getActiveDevices(userId: string): Promise<DeviceToken[]> {
    return this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      orderBy: { lastUsed: 'desc' },
    });
  }

  async updateBiometricStatus(
    userId: string,
    token: string,
    enabled: boolean,
  ): Promise<void> {
    const deviceToken = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
    });

    if (!deviceToken) {
      throw new NotFoundException('Device token not found');
    }

    await this.prisma.deviceToken.update({
      where: { id: deviceToken.id },
      data: { biometricEnabled: enabled },
    });
  }

  async validateDeviceToken(
    userId: string,
    token: string,
    requireAdmin = false,
  ): Promise<boolean> {
    const deviceToken = await this.prisma.deviceToken.findFirst({
      where: { token, userId, isActive: true },
    });

    if (!deviceToken) {
      return false;
    }

    if (requireAdmin && !deviceToken.isAdminDevice) {
      return false;
    }

    await this.prisma.deviceToken.update({
      where: { id: deviceToken.id },
      data: { lastUsed: new Date() },
    });

    return true;
  }
}
