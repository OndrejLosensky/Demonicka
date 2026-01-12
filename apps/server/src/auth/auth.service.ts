import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  public getCookieOptions(isRefreshToken = false) {
    return {
      httpOnly: true, // Prevents client-side access to the cookie
      secure: this.configService.get('NODE_ENV') === 'production', // Only send cookie over HTTPS in production
      sameSite: 'lax' as const, // Protection against CSRF
      path: '/', // Cookie is available for all paths
      expires: new Date(
        Date.now() +
          (isRefreshToken ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000),
      ), // 7 days for refresh, 15 mins for access
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

  async login(user: UserWithoutPassword): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserWithoutPassword;
  }> {
    const payload = { username: user.username, sub: user.id };
    const access_token = await this.jwtService.signAsync(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token,
      refresh_token: refreshToken.token,
      user,
    };
  }

  async logout(response: Response): Promise<void> {
    response.clearCookie('refresh_token', this.getCookieOptions(true));
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
      throw new UnauthorizedException('Neplatný obnovovací token');
    }

    const user = await this.usersService.findOne(refreshToken.userId);
    if (!user) {
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

  private async createRefreshToken(userId: string) {
    const timestamp = Date.now();
    const token = this.jwtService.sign(
      { sub: userId, iat: timestamp },
      { expiresIn: '7d' }, // 7 days
    );

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(timestamp + 7 * 24 * 60 * 60 * 1000), // 7 days
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
