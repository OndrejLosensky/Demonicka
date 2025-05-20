import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(
      registerDto.username,
      registerDto.password,
      registerDto.email,
    );

    const tokens = await this.generateTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOne(loginDto.usernameOrEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token || token.isRevoked || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate refresh token
    await this.revokeRefreshToken(token.id, 'Token rotation');
    const tokens = await this.generateTokens(token.user);

    return tokens;
  }

  async logout(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (token) {
      await this.revokeRefreshToken(token.id, 'User logout');
    }
  }

  private async generateTokens(user: User) {
    const accessToken = this.jwtService.sign(
      { sub: user.id.toString(), email: user.email },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.createRefreshToken(user);

    return {
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  private async createRefreshToken(user: User) {
    const token = new RefreshToken();
    token.token = uuidv4();
    token.user = user;
    token.userId = user.id.toString();
    token.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.refreshTokenRepository.save(token);
  }

  private async revokeRefreshToken(tokenId: string, reason: string) {
    await this.refreshTokenRepository.update(tokenId, {
      isRevoked: true,
      reasonRevoked: reason,
    });
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(Number(userId));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
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
