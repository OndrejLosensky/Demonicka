import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest<TUser extends User = User>(err: any, user: TUser): TUser {
    if (err || !user) {
      throw err;
    }
    return user;
  }
}
