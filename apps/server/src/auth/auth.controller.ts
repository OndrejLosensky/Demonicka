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
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Public } from './decorators/public.decorator';
import { User } from '@prisma/client';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { UsersService } from '../users/users.service';
import { TwoFactorService } from './two-factor.service';
import { CompleteRegistrationDto } from '../users/dto/complete-registration.dto';

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
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Register a new user
   * @param createUserDto User registration data including username, password, name, gender
   * @returns User data without password
   */
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error: any) {
      // Prisma unique constraint error code is P2002
      if (
        error?.code === 'P2002' &&
        error?.meta?.target?.includes('username')
      ) {
        throw new BadRequestException('Uživatelské jméno již existuje');
      }
      throw error;
    }
  }

  /**
   * Authenticate user and create session
   * @param loginDto Login credentials (username/email and password) and optional 2FA code
   * @param req Request object containing user data from JWT
   * @param response Express response object for setting cookies
   * @returns User data and access token, or requiresTwoFactor flag
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<
    | { access_token: string; user: UserResponse }
    | { requiresTwoFactor: boolean; message: string }
  > {
    const { user } = req;
    const fullUser = await this.usersService.findOne(user.id);

    // Check if 2FA is enabled
    if (fullUser.isTwoFactorEnabled) {
      // If no code provided, generate and send code
      if (!loginDto.twoFactorCode) {
        try {
          await this.twoFactorService.generateAndSendCode(user.id);
          return {
            requiresTwoFactor: true,
            message: 'Kód pro dvoufázové ověření byl odeslán na váš email',
          };
        } catch (error) {
          throw new BadRequestException(
            'Nepodařilo se odeslat kód pro dvoufázové ověření',
          );
        }
      }

      // Validate 2FA code
      const isValid = await this.twoFactorService.validateCode(
        user.id,
        loginDto.twoFactorCode,
      );
      if (!isValid) {
        throw new UnauthorizedException(
          'Neplatný nebo vypršený kód pro dvoufázové ověření',
        );
      }
    }

    // Proceed with normal login
    const { access_token, refresh_token } = await this.authService.login(user);
    await this.usersService.update(user.id, { lastAdminLogin: new Date() });

    // Set refresh token as an HTTP-only cookie
    response.cookie(
      'refresh_token',
      refresh_token,
      this.authService.getCookieOptions(true),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
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
    const { password: _, ...userWithoutPassword } = currentUser;
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
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Obnovovací token nebyl nalezen');
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    // Set new refresh token cookie
    response.cookie(
      'refresh_token',
      newRefreshToken,
      this.authService.getCookieOptions(true),
    );

    return { accessToken };
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

  /**
   * Complete registration for users with registration token
   * @param completeRegistrationDto Registration completion data including token, username, and password
   * @returns Completed user data and access token
   */
  @Public()
  @Post('complete-registration')
  async completeRegistration(
    @Body() completeRegistrationDto: CompleteRegistrationDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ access_token: string; user: UserResponse }> {
    const user = await this.usersService.completeRegistration(
      completeRegistrationDto,
    );
    const { access_token, refresh_token } = await this.authService.login(user);
    await this.usersService.update(user.id, { lastAdminLogin: new Date() });

    // Set refresh token as an HTTP-only cookie
    response.cookie(
      'refresh_token',
      refresh_token,
      this.authService.getCookieOptions(true),
    );

    return { access_token, user };
  }

  /**
   * Enable 2FA for current user (sends verification code)
   * @param req Request object containing user data from JWT
   * @returns Success message
   */
  @Post('2fa/enable')
  async enableTwoFactor(@GetUser() user: User): Promise<{ message: string }> {
    const fullUser = await this.usersService.findOne(user.id);
    if (!fullUser.email) {
      throw new BadRequestException(
        'Pro aktivaci dvoufázového ověření musíte mít nastavenou emailovou adresu',
      );
    }

    if (fullUser.isTwoFactorEnabled) {
      throw new BadRequestException('Dvoufázové ověření je již aktivováno');
    }

    await this.twoFactorService.generateAndSendCode(user.id);
    return {
      message: 'Kód pro ověření byl odeslán na váš email',
    };
  }

  /**
   * Verify 2FA code and enable 2FA
   * @param verifyDto Verification code
   * @param req Request object containing user data from JWT
   * @returns Success message
   */
  @Post('2fa/verify')
  async verifyTwoFactor(
    @Body() verifyDto: Verify2FADto,
    @GetUser() user: User,
  ): Promise<{ message: string }> {
    const isValid = await this.twoFactorService.validateCode(
      user.id,
      verifyDto.code,
    );
    if (!isValid) {
      throw new UnauthorizedException('Neplatný nebo vypršený ověřovací kód');
    }

    // Enable 2FA
    await this.usersService.update(user.id, { isTwoFactorEnabled: true });
    return {
      message: 'Dvoufázové ověření bylo úspěšně aktivováno',
    };
  }

  /**
   * Disable 2FA for current user
   * @param req Request object containing user data from JWT
   * @returns Success message
   */
  @Post('2fa/disable')
  async disableTwoFactor(@GetUser() user: User): Promise<{ message: string }> {
    await this.usersService.update(user.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: undefined,
    });
    return {
      message: 'Dvoufázové ověření bylo deaktivováno',
    };
  }
}
