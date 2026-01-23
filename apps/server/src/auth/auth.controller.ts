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
import { AuthGuard } from '@nestjs/passport';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { UsersService } from '../users/users.service';
import { TwoFactorService } from './two-factor.service';
import { CompleteRegistrationDto } from '../users/dto/complete-registration.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  /**
   * Initiate Google OAuth login flow
   * Redirects user to Google OAuth consent screen
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * Handle Google OAuth callback
   * Creates or links user account and returns JWT tokens
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { user } = req;
    const fullUser = await this.usersService.findOne(user.id);

    // Generate tokens
    const { access_token, refresh_token } = await this.authService.login(user);

    // Set refresh token as an HTTP-only cookie
    response.cookie(
      'refresh_token',
      refresh_token,
      this.authService.getCookieOptions(true),
    );

    // Redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    response.redirect(
      `${frontendUrl}/auth/google/callback?token=${access_token}`,
    );
  }

  /**
   * Link Google account to existing authenticated user
   * User must be logged in to link their Google account
   * Creates a signed token with user ID to pass in OAuth state
   */
  @Get('google/link')
  @UseGuards(JwtAuthGuard)
  async linkGoogleAccount(
    @GetUser() currentUser: User,
    @Res() response: Response,
  ): Promise<void> {
    // Create a signed token with user ID for the callback
    const linkToken = await this.jwtService.signAsync(
      { userId: currentUser.id, type: 'link' },
      { expiresIn: '10m' },
    );

    // Build Google OAuth URL with link token in state
    const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectURI = `${this.configService.get<string>('API_URL') || 'http://localhost:3000'}/api/auth/google/link/callback`;
    const scope = 'email profile';
    const encodedState = encodeURIComponent(linkToken);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectURI)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodedState}`;
    response.redirect(googleAuthUrl);
  }

  /**
   * Handle Google OAuth callback for linking account
   * Verifies the link token and links Google account to user
   */
  @Get('google/link/callback')
  @Public()
  async linkGoogleAccountCallback(
    @Req() req: any,
    @Res() response: Response,
  ): Promise<void> {
    const { code, state } = req.query;

    if (!code || !state) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173';
      response.redirect(`${frontendUrl}/profile?error=google_link_failed`);
      return;
    }

    try {
      // Verify and decode the link token
      const payload = await this.jwtService.verifyAsync(state as string, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'link' || !payload.userId) {
        throw new Error('Invalid link token');
      }

      const currentUser = await this.usersService.findOne(payload.userId);

      // Exchange code for Google tokens and profile
      const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );
      const redirectURI = `${this.configService.get<string>('API_URL') || 'http://localhost:3000'}/api/auth/google/link/callback`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientID!,
          client_secret: clientSecret!,
          redirect_uri: redirectURI,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokens = (await tokenResponse.json()) as {
        access_token: string;
        token_type: string;
        expires_in: number;
      };

      // Get Google user profile
      const profileResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      );

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch Google profile');
      }

      const googleProfile = (await profileResponse.json()) as {
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
        locale: string;
      };

      // Check if this Google account is already linked to another user
      if (googleProfile.id) {
        const existingUser = await this.usersService.findByGoogleId(
          googleProfile.id,
        );
        if (existingUser && existingUser.id !== currentUser.id) {
          const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ||
            'http://localhost:5173';
          response.redirect(
            `${frontendUrl}/profile?error=google_account_already_linked`,
          );
          return;
        }
      }

      // Link Google account to current user
      // Don't overwrite existing profile picture - store Google picture separately
      await this.usersService.update(currentUser.id, {
        googleId: googleProfile.id,
        email: googleProfile.email?.toLowerCase() || (currentUser.email ?? undefined),
        // Store Google profile picture separately, preserve existing profile picture
        googleProfilePictureUrl: googleProfile.picture,
        // Only set profile picture if user doesn't have one
        profilePictureUrl: currentUser.profilePictureUrl || googleProfile.picture || undefined,
        name: currentUser.name || googleProfile.name,
        firstName: currentUser.firstName || googleProfile.given_name,
        lastName: currentUser.lastName || googleProfile.family_name,
      });

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173';
      response.redirect(`${frontendUrl}/profile?success=google_account_linked`);
    } catch (error) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173';
      response.redirect(`${frontendUrl}/profile?error=google_link_failed`);
    }
  }

  /**
   * Unlink Google account from current user
   * User must be logged in
   */
  @Post('google/unlink')
  async unlinkGoogleAccount(
    @GetUser() currentUser: User,
  ): Promise<{ message: string }> {
    await this.usersService.update(currentUser.id, {
      googleId: undefined,
    });

    return {
      message: 'Google účet byl úspěšně odpojen',
    };
  }
}
