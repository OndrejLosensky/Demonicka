import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LATEST_VERSION } from '../constants/version.constants';

@Injectable()
export class VersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const version = req.headers['x-api-version'] || LATEST_VERSION;
    req['apiVersion'] = version;
    res.setHeader('X-API-Version', version);
    next();
  }
}
