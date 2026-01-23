import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly CODE_EXPIRY_MINUTES = 10;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  /**
   * Generate a 6-digit random code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate and send a 2FA code to the user's email
   */
  async generateAndSendCode(userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.email) {
      throw new BadRequestException(
        'Email address is required for two-factor authentication',
      );
    }

    // Clean up expired codes first
    await this.cleanupExpiredCodes(userId);

    // Generate new code
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

    // Store code in database
    await this.prisma.twoFactorCode.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    // Send email
    try {
      await this.emailService.sendTwoFactorCode(user.email, code);
      this.logger.log(`2FA code generated and sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send 2FA code to user ${userId}:`, error);
      // Clean up the code if email sending failed
      await this.prisma.twoFactorCode.deleteMany({
        where: {
          userId,
          code,
        },
      });
      throw new BadRequestException('Failed to send verification code');
    }
  }

  /**
   * Validate a 2FA code for a user
   */
  async validateCode(userId: string, code: string): Promise<boolean> {
    const twoFactorCode = await this.prisma.twoFactorCode.findFirst({
      where: {
        userId,
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!twoFactorCode) {
      this.logger.warn(
        `Invalid or expired 2FA code attempted for user ${userId}`,
      );
      return false;
    }

    // Mark code as used
    await this.prisma.twoFactorCode.update({
      where: { id: twoFactorCode.id },
      data: { isUsed: true },
    });

    this.logger.log(`2FA code validated successfully for user ${userId}`);
    return true;
  }

  /**
   * Clean up expired codes for a specific user
   */
  async cleanupExpiredCodes(userId: string): Promise<void> {
    const result = await this.prisma.twoFactorCode.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true },
        ],
      },
    });

    if (result.count > 0) {
      this.logger.debug(
        `Cleaned up ${result.count} expired/used 2FA codes for user ${userId}`,
      );
    }
  }

  /**
   * Clean up all expired codes (for periodic cleanup)
   */
  async cleanupAllExpiredCodes(): Promise<void> {
    const result = await this.prisma.twoFactorCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true },
        ],
      },
    });

    if (result.count > 0) {
      this.logger.debug(`Cleaned up ${result.count} expired/used 2FA codes`);
    }
  }
}
