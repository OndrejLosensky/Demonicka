import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '@prisma/client';
import { LoggingService } from '../../logging/logging.service';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly loggingService: LoggingService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) {
      this.loggingService.auditFailure('AUTH_TOKEN_INVALID', 'Auth failed – user not found', {
        username: payload.username,
      });
      throw new UnauthorizedException();
    }
    if (user.deletedAt) {
      this.loggingService.auditFailure('AUTH_TOKEN_INVALID', 'Auth failed – user deleted', {
        username: payload.username,
        userId: user.id,
      });
      throw new UnauthorizedException('Uživatel byl smazán');
    }
    if (!user.canLogin) {
      this.loggingService.auditFailure('AUTH_TOKEN_INVALID', 'Auth failed – login disabled for user', {
        username: payload.username,
        userId: user.id,
      });
      throw new UnauthorizedException('Přihlášení není pro tohoto uživatele povoleno');
    }
    return user;
  }
}
