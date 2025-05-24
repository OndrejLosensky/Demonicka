import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
  };
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: RequestWithCookies): string | null => {
          return request?.cookies?.refreshToken || null;
        },
      ]),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(
    request: RequestWithCookies,
    payload: JwtPayload,
  ): Promise<{ id: string; email: string }> {
    const refreshToken = request?.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Obnovovací token nebyl nalezen');
    }

    const isValid = await this.authService.validateRefreshToken(
      refreshToken,
      parseInt(payload.sub, 10),
    );
    if (!isValid) {
      throw new UnauthorizedException('Neplatný obnovovací token');
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
