import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const match = (req.originalUrl || req.url).match(/^\/tenants\/([^/]+)/);

    // use this "/\/tenants\/([^/]+)/" for if /tenants/:tenantId might appear later in the path (because of versioning, prefixes, etc.)

    req.tenantId = match?.[1] ?? null;
    next();
  }
}
