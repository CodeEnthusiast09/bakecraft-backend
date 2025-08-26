import { DataSource, DataSourceOptions } from 'typeorm';
import { tenantConfig } from '../tenant/tenant-orm.config';
import { publicConfig } from '../public/public-orm.config';
import { Tenant } from '../public/entities/tenants.entity';

const connectionCache: Record<string, DataSource> = {};

const mainDataSource = new DataSource({
  ...publicConfig,
  database: process.env.DB_NAME,
  name: 'main',
} as DataSourceOptions);

async function getTenantDbName(tenantId: string): Promise<string> {
  if (!mainDataSource.isInitialized) {
    await mainDataSource.initialize();
  }

  const tenant = await mainDataSource.getRepository(Tenant).findOne({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error(`Tenant with id ${tenantId} not found`);
  }

  const slug =
    tenant.slug ?? tenant.company_name.toLowerCase().replace(/\s+/g, '_');

  return `tenant_${slug}`;
}

export async function getTenantConnection(
  tenantId: string,
): Promise<DataSource> {
  const dbName = await getTenantDbName(tenantId);

  if (connectionCache[dbName] && connectionCache[dbName].isInitialized) {
    return connectionCache[dbName];
  }

  const dataSource = new DataSource({
    ...tenantConfig,
    database: dbName,
    name: `tenant-${tenantId}`,
  } as DataSourceOptions);

  await dataSource.initialize();
  connectionCache[dbName] = dataSource;

  return dataSource;
}
