import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { User } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
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
