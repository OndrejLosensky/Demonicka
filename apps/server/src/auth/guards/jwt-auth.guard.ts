import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { BYPASS_AUTH_KEY } from '../decorators/bypass-auth.decorator';
import { config } from '../../config';
import { Request } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isPublic) {
      return true;
    }

    const canBypass = this.reflector.getAllAndOverride<boolean>(
      BYPASS_AUTH_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (canBypass && config?.bypassAuth?.enabled) {
      const request = context.switchToHttp().getRequest<Request>();
      const bypassToken = request.headers['x-bypass-token'];
      
      if (bypassToken === config.bypassAuth?.token) {
        // Inject admin user for bypass auth
        const adminUser: User = {
          id: '00000000-0000-0000-0000-000000000000',
          username: 'bypass.admin',
          role: UserRole.ADMIN,
          isRegistrationComplete: true,
          gender: 'MALE',
          password: null,
          name: null,
          firstName: null,
          lastName: null,
          beerCount: 0,
          lastBeerTime: null,
          registrationToken: null,
          isTwoFactorEnabled: false,
          twoFactorSecret: null,
          isAdminLoginEnabled: false,
          allowedIPs: [],
          lastAdminLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        request.user = adminUser;
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest<TUser extends User = User>(
    err: Error | null,
    user: TUser | false,
    info: unknown,
  ): TUser {
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Neplatný JWT token');
    }

    if (err || !user) {
      throw new UnauthorizedException(
        err?.message || 'Nemáte oprávnění k přístupu k tomuto zdroji',
      );
    }

    return user;
  }
}
