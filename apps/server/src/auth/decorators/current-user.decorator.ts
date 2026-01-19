import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (
    data: unknown,
    ctx: ExecutionContext,
  ): Omit<User, 'password'> | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: omitted, ...userWithoutPassword } = request.user;
    return userWithoutPassword;
  },
);
