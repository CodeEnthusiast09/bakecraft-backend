import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { tenantId?: string }>();
    return request.tenantId;
  },
);
