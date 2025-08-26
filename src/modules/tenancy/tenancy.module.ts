import { Global, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request as ExpressRequest } from 'express';
import { getTenantConnection } from './tenancy.utils';
import { CONNECTION } from './tenancy.symbol';

const connectionFactory = {
  provide: CONNECTION,
  scope: Scope.REQUEST,
  useFactory: async (request: ExpressRequest) => {
    const { tenantId } = request;
    if (!tenantId) throw new Error('Tenant ID missing in request');
    return getTenantConnection(tenantId);
  },
  inject: [REQUEST],
};

@Global()
@Module({
  providers: [connectionFactory],
  exports: [CONNECTION],
})
export class TenancyModule {}
