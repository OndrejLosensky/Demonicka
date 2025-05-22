import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

interface RequestWithUser extends Request {
  user: User;
  cookies: {
    refresh_token?: string;
  };
}

/**
 * Authentication controller handling user registration, login, token refresh, and session management.
 * All routes are prefixed with '/auth' and support API versioning.
 */
@Controller('auth')
@Versions('1')
@UseGuards(VersionGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * @param registerDto User registration data including username, email, password, firstName, lastName
   * @param response Express response object for setting cookies
   * @returns User data and authentication tokens
   */
  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user } = await this.authService.register(registerDto);
    return this.authService.login(user, response);
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
    @Body() loginDto: LoginDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('No user found in request');
    }
    return this.authService.login(req.user, response);
  }

  /**
   * Refresh access token using refresh token from cookies
   * @param req Request object containing refresh token cookie
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or missing
   */
  @Post('refresh')
  async refresh(@Req() req: RequestWithUser) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
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
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }
}
