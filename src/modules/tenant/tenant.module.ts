import { DynamicModule, Module, Scope } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { DataSource, DataSourceOptions } from 'typeorm';
import { tenantConfig } from './tenant-orm.config';
import { EmailModule } from './email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {
  static forTenant(database: string): DynamicModule {
    return {
      module: TenantModule,
      controllers: [TenantController],
      providers: [
        {
          provide: DataSource,
          scope: Scope.REQUEST,
          useFactory: async (): Promise<DataSource> => {
            const tenantDataSource = new DataSource({
              ...tenantConfig,
              database,
            } as DataSourceOptions);
            await tenantDataSource.initialize();
            return tenantDataSource;
          },
        },
        {
          provide: TenantService,
          useClass: TenantService,
          scope: Scope.REQUEST,
        },
      ],
      exports: [TenantService],
    };
  }
}
