import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const host = (req.headers['host'] || '') as string;
    const isLocal =
      host.includes('localhost') || host.includes('127.0.0.1');

    let tenantSlug: string | null = null;

    if (isLocal) {
      tenantSlug = (req.headers['x-tenant-slug'] as string) || null;
    } else {
      const parts = host.split('.');
      if (parts.length >= 3) {
        tenantSlug = parts[0];
      }
    }

    req.tenantId = tenantSlug;
    next();
  }
}
