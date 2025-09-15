import { Request as ExpressRequest } from 'express';

declare namespace Express {
  interface Request {
    tenantId?: string | null;
  }
}

export {};
