import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { User } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    
    if (path.includes('/backup')) {
      this.logger.log(`[JwtAuthGuard] Checking auth for ${path}`);
    }
    
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      if (path.includes('/backup')) {
        this.logger.log(`[JwtAuthGuard] Route is public, allowing access`);
      }
      return true;
    }

    if (path.includes('/backup')) {
      this.logger.log(`[JwtAuthGuard] Route requires auth, calling super.canActivate`);
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
