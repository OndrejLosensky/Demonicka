import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VERSION_CONFIGS } from '../constants/version.constants';

interface RequestWithVersion extends Request {
  apiVersion: string;
}

@Injectable()
export class VersionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithVersion>();
    const version = request.apiVersion;

    // Check if version exists and is not deprecated
    const versionConfig = VERSION_CONFIGS[version];
    if (!versionConfig) {
      return false;
    }

    if (versionConfig.deprecated) {
      // You could also throw a custom exception here
      return false;
    }

    return true;
  }
}
