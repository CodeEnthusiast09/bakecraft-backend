import { DataSource, DataSourceOptions } from 'typeorm';
import { tenantConfig } from '../tenant/tenant-orm.config';
import { publicConfig } from '../public/public-orm.config';
import { Tenant } from '../public/entities/tenant.entity';

const connectionCache: Record<string, DataSource> = {};

const mainDataSource = new DataSource({
  ...publicConfig,
  database: process.env.DB_NAME,
  name: 'main',
} as DataSourceOptions);

async function getTenantSchema(tenantSlug: string): Promise<string> {
  if (!mainDataSource.isInitialized) {
    await mainDataSource.initialize();
  }

  const tenant = await mainDataSource.getRepository(Tenant).findOne({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    throw new Error(`Tenant not found`);
  }

  return `tenant_${tenant.slug}`;
}

export async function getTenantConnection(
  tenantSlug: string,
): Promise<DataSource> {
  const schema = await getTenantSchema(tenantSlug);

  if (connectionCache[schema] && connectionCache[schema].isInitialized) {
    return connectionCache[schema];
  }

  const dataSource = new DataSource({
    ...tenantConfig,
    schema,
    name: `tenant-${tenantSlug}`,
  } as DataSourceOptions);

  await dataSource.initialize();
  connectionCache[schema] = dataSource;

  return dataSource;
}
