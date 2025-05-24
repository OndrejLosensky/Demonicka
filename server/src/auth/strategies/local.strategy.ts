import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'usernameOrEmail',
    });
  }

  async validate(
    usernameOrEmail: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    this.logger.debug(
      `Attempting to validate user with username/email: ${usernameOrEmail}`,
    );

    const user = await this.authService.validateUser(usernameOrEmail, password);
    if (!user) {
      this.logger.debug('User validation failed - invalid credentials');
      throw new UnauthorizedException('Neplatné přihlašovací údaje');
    }

    this.logger.debug('User validation successful');
    return user;
  }
}
