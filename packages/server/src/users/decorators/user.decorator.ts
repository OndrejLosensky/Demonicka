import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Request } from 'express';

export const RequestUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    // Since this is used with JwtAuthGuard, we know user will be defined
    return request.user;
  },
);
