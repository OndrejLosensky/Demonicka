import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { LoggingService } from '../logging/logging.service';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loggingService: LoggingService,
  ) {}

  public getCookieOptions(isRefreshToken = false, rememberMe = true) {
    const base = {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    if (!isRefreshToken) {
      return {
        ...base,
        expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours for access
      };
    }
    if (!rememberMe) {
      return base; // session cookie (no expires)
    }
    return {
      ...base,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for refresh
    };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByUsername(username);
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async login(user: UserWithoutPassword, rememberMe = true): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserWithoutPassword;
  }> {
    const payload = { username: user.username, sub: user.id };
    const access_token = await this.jwtService.signAsync(payload);
    const refreshToken = await this.createRefreshToken(user.id, rememberMe);

    return {
      access_token,
      refresh_token: refreshToken.token,
      user,
    };
  }

  async logout(response: Response): Promise<void> {
    response.clearCookie('refresh_token', this.getCookieOptions(true, true));
  }

  async refreshTokens(refreshTokenStr: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (
      !refreshToken ||
      refreshToken.isRevoked ||
      new Date() > refreshToken.expiresAt
    ) {
      this.loggingService.auditFailure('REFRESH_TOKEN_INVALID', 'Refresh token invalid or expired', {});
      throw new UnauthorizedException('Neplatný obnovovací token');
    }

    const user = await this.usersService.findOne(refreshToken.userId);
    if (!user) {
      this.loggingService.auditFailure('REFRESH_TOKEN_INVALID', 'Refresh token – user not found', {
        userId: refreshToken.userId,
      });
      throw new UnauthorizedException('Uživatel nebyl nalezen');
    }

    // Generate new tokens
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.createRefreshToken(user.id);

    // Revoke old refresh token
    await this.revokeRefreshToken(refreshToken.id, 'Refreshed');

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  private async createRefreshToken(userId: string, rememberMe = true) {
    const timestamp = Date.now();
    const durationMs = rememberMe
      ? 7 * 24 * 60 * 60 * 1000 // 7 days
      : 24 * 60 * 60 * 1000; // 24 hours for session-like
    const expiresIn = rememberMe ? '7d' : '24h';

    const token = this.jwtService.sign(
      { sub: userId, iat: timestamp },
      { expiresIn },
    );

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(timestamp + durationMs),
      },
    });

    return refreshToken;
  }

  private async revokeRefreshToken(
    tokenId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        isRevoked: true,
        reasonRevoked: reason,
      },
    });
  }

  async validateRefreshToken(token: string, userId: number): Promise<boolean> {
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: { token, userId: userId.toString() },
    });

    if (!refreshToken) {
      return false;
    }

    if (refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
      return false;
    }

    return true;
  }
}
