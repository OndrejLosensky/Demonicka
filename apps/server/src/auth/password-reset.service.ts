import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

const CODE_EXPIRY_MINUTES = 30;
const RATE_LIMIT_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly requestCountByEmail = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private checkRateLimit(email: string): void {
    const key = email.toLowerCase();
    const now = Date.now();
    const entry = this.requestCountByEmail.get(key);

    if (!entry) {
      this.requestCountByEmail.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }

    if (now >= entry.resetAt) {
      this.requestCountByEmail.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }

    entry.count += 1;
    if (entry.count > RATE_LIMIT_REQUESTS) {
      throw new HttpException(
        'Příliš mnoho žádostí. Zkuste to znovu později.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Request a password reset: send OTP to email if user exists and has a password.
   * Always returns success for security (no user enumeration).
   */
  async requestReset(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    this.checkRateLimit(normalizedEmail);

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user || !user.email || !user.password) {
      this.logger.log(
        `Password reset skipped: no account or OAuth-only for email: ${normalizedEmail}`,
      );
      return;
    }

    await this.cleanupExpiredCodes(user.id);

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

    await this.prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    const sendingMsg = `Sending password reset email to ${user.email} (userId: ${user.id})`;
    this.logger.log(sendingMsg);
    try {
      await this.emailService.sendPasswordResetCode(user.email, code);
      this.logger.log(`Password reset code sent successfully to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email} (userId: ${user.id}):`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.prisma.passwordResetCode.deleteMany({
        where: { userId: user.id, code },
      });
      throw new BadRequestException('Nepodařilo se odeslat email s kódem');
    }
  }

  /**
   * Reset password with OTP code. Throws generic error for invalid/expired code.
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user?.email) {
      throw new BadRequestException('Neplatný nebo vypršený kód');
    }

    const resetCode = await this.prisma.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetCode) {
      this.logger.warn(
        `Invalid or expired password reset code for user ${user.id}`,
      );
      throw new BadRequestException('Neplatný nebo vypršený kód');
    }

    await this.prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { isUsed: true },
    });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    try {
      await this.emailService.sendPasswordChangedConfirmation(user.email);
    } catch (error) {
      this.logger.warn(
        `Password changed but confirmation email failed for ${user.id}:`,
        error,
      );
      // Don't fail the request; password was already updated
    }

    this.logger.log(`Password reset completed for user ${user.id}`);
  }

  private async cleanupExpiredCodes(userId: string): Promise<void> {
    await this.prisma.passwordResetCode.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }],
      },
    });
  }
}
