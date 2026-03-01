import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { randomBytes } from 'crypto';

/**
 * Google OAuth guard that passes custom state when client=mobile
 * so the callback can redirect to the mobile app scheme.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const mobile = req?.query?.mobile === '1';
    if (mobile) {
      const rand = randomBytes(16).toString('hex');
      return { state: `mobile-${rand}` };
    }
    return undefined;
  }
}
