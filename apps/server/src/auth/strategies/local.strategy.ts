import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private loggingService: LoggingService,
  ) {
    super({
      usernameField: 'username',
    });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      this.loggingService.auditFailure('LOGIN_FAILED', 'Login failed – invalid credentials', {
        username,
      });
      throw new UnauthorizedException('Neplatné přihlašovací údaje');
    }
    return user;
  }
}
