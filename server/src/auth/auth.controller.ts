import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { UsersService } from '../users/users.service';
import { QueryFailedError } from 'typeorm';

interface RequestWithUser extends Request {
  user: User;
  cookies: {
    refresh_token?: string;
  };
}

type UserResponse = Omit<User, 'password'>;

/**
 * Authentication controller handling user registration, login, token refresh, and session management.
 * All routes are prefixed with '/auth' and support API versioning.
 */
@Controller('auth')
@Versions('1')
@UseGuards(VersionGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Register a new user
   * @param registerDto User registration data including username, email, password, firstName, lastName
   * @param response Express response object for setting cookies
   * @returns User data and authentication tokens
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<UserResponse> {
    try {
      return await this.usersService.create(registerDto);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('UNIQUE constraint failed')
      ) {
        throw new BadRequestException('Uživatelské jméno již existuje');
      }
      throw error;
    }
  }

  /**
   * Authenticate user and create session
   * @param loginDto Login credentials (username/email and password)
   * @param req Request object containing user data from JWT
   * @param response Express response object for setting cookies
   * @returns User data and access token
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: RequestWithUser,
  ): Promise<{ access_token: string; user: UserResponse }> {
    const { user } = req;
    const { access_token } = await this.authService.login(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user as User;
    return { access_token, user: userWithoutPassword };
  }

  /**
   * Get current user data
   * @param req Request object containing user data from JWT
   * @returns Current user data
   */
  @Get('me')
  async getCurrentUser(@Req() req: RequestWithUser): Promise<UserResponse> {
    const { user } = req;
    const currentUser = await this.usersService.findOne(user.id);
    if (!currentUser) {
      throw new UnauthorizedException('Uživatel nebyl nalezen');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = currentUser as User;
    return userWithoutPassword;
  }

  /**
   * Refresh access token using refresh token from cookies
   * @param req Request object containing refresh token cookie
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or missing
   */
  @Public()
  @Post('refresh')
  async refresh(@Req() req: RequestWithUser) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Obnovovací token nebyl nalezen');
    }
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * Logout user and invalidate refresh token
   * @param response Express response object for clearing cookie
   */
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  /**
   * Get current user profile
   * @param req Request object containing user data from JWT
   * @returns Current user profile
   */
  @Get('profile')
  async getProfile(@Body('user') user: User): Promise<UserResponse> {
    if (!user) {
      throw new UnauthorizedException('Uživatel není přihlášen');
    }
    const profile = await this.usersService.findOne(user.id);
    if (!profile) {
      throw new UnauthorizedException('Uživatel nebyl nalezen');
    }
    return profile;
  }
}
