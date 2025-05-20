import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
  };
}

/**
 * Authentication controller handling user registration, login, token refresh, and session management.
 * All routes are prefixed with '/auth'.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * @param registerDto User registration data including username, email, password, firstName, lastName
   * @returns User data and authentication tokens
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticate user and create session
   * @param loginDto Login credentials (username/email and password)
   * @param response Express response object for setting cookies
   * @returns User data and access token
   */
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set refresh token as HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only the access token and user data
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * Refresh access token using refresh token from cookies
   * @param req Request object containing refresh token cookie
   * @param response Express response object for setting new cookie
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or missing
   */
  @Public()
  @Post('refresh')
  async refreshTokens(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: tokens.accessToken,
    };
  }

  /**
   * Logout user and invalidate refresh token
   * @param req Request object containing refresh token cookie
   * @param response Express response object for clearing cookie
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear the refresh token cookie
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  /**
   * Get current user profile
   * @param req Request object containing user data from JWT
   * @returns Current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: RequestWithUser): User {
    return req.user;
  }
}
