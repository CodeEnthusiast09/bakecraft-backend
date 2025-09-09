import { tenantConfig } from '../tenant-orm.config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('TenantMigration');

export async function migrateTenantsSchema(schema: string): Promise<void> {
  const ds = new DataSource({
    ...tenantConfig,
    schema,
    name: `tenant-${schema}`,
  } as DataSourceOptions);

  try {
    logger.log(`🚀 Initializing datasource for "${schema}"`);
    await ds.initialize();

    logger.log(`🔧 Ensuring "uuid-ossp" extension for "${schema}"`);
    await ds.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    logger.log(`📦 Running migrations for "${schema}"`);
    await ds.runMigrations();

    logger.log(`✅ Migration completed for "${schema}"`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? (err.stack ?? err.message) : String(err);

    logger.error(`❌ Migration failed for "${schema}"`, message);

    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
      logger.log(`🔌 Connection closed for "${schema}"`);
    }
  }
}
