import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const match = (req.originalUrl || req.url).match(/^\/tenants\/([^/]+)/);

    // use this "/\/tenants\/([^/]+)/" for if /tenants/:tenantId might appear later in the path (because of versioning, prefixes, etc.)

    /* IF I WANT TO USE HEADERS */

    // let tenantId = match?.[1];

    // if (!tenantId && req.headers['x-tenant-id']) {
    //   tenantId = req.headers['x-tenant-id'] as string;
    // }

    // req.tenantId = tenantId ?? null;

    req.tenantId = match?.[1] ?? null;
    next();
  }
}
