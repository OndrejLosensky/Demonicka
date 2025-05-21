import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { User } from '../../users/entities/user.entity';

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
      throw new UnauthorizedException('Invalid JWT token');
    }

    if (err || !user) {
      throw new UnauthorizedException(
        err?.message || 'You are not authorized to access this resource',
      );
    }

    return user;
  }
}
