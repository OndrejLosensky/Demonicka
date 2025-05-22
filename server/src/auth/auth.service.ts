import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getCookieOptions(isRefreshToken = false) {
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
    usernameOrEmail: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(`Looking up user by username: ${usernameOrEmail}`);
    let user = await this.usersService.findByUsername(usernameOrEmail);

    if (!user) {
      this.logger.debug('User not found by username, trying email');
      user = await this.usersService.findByEmail(usernameOrEmail);
    }

    if (!user) {
      this.logger.debug('User not found');
      return null;
    }

    this.logger.debug('Comparing passwords');
    this.logger.debug(`Input password length: ${password.length}`);
    this.logger.debug(`Stored hash length: ${user.password.length}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.debug(`Password comparison result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      this.logger.debug('Password comparison failed');
      return null;
    }

    this.logger.debug('User validated successfully');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: omitted, ...result } = user;
    return result;
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Omit<User, 'password'> }> {
    const user = await this.usersService.create(registerDto);
    return { user };
  }

  async login(user: Omit<User, 'password'>, response: Response) {
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    // Set cookies
    response.cookie('access_token', accessToken, this.getCookieOptions());
    response.cookie(
      'refresh_token',
      refreshToken.token,
      this.getCookieOptions(true),
    );

    return {
      user,
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  async logout(response: Response) {
    await Promise.all([
      response.clearCookie('access_token', this.getCookieOptions()),
      response.clearCookie('refresh_token', this.getCookieOptions(true)),
    ]);
    return { message: 'Logout successful' };
  }

  async refreshTokens(refreshTokenStr: string) {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenStr },
      relations: ['user'],
    });

    if (
      !refreshToken ||
      refreshToken.isRevoked ||
      new Date() > refreshToken.expiresAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(refreshToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
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

  private async createRefreshToken(userId: string): Promise<RefreshToken> {
    const token = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '7d' }, // 7 days
    );

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  private async revokeRefreshToken(
    tokenId: string,
    reason: string,
  ): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, {
      isRevoked: true,
      reasonRevoked: reason,
    });
  }

  async validateRefreshToken(token: string, userId: number): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
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
