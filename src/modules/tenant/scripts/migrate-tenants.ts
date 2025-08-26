import { tenantConfig } from '../tenant-orm.config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('TenantMigration');

export async function migrateTenantsDatabase(database: string): Promise<void> {
  const ds = new DataSource({
    ...tenantConfig,
    database,
    name: `tenant-${database}`,
  } as DataSourceOptions);

  try {
    logger.log(`🚀 Initializing datasource for "${database}"`);
    await ds.initialize();

    logger.log(`🔧 Ensuring "uuid-ossp" extension for "${database}"`);
    await ds.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    logger.log(`📦 Running migrations for "${database}"`);
    await ds.runMigrations();

    logger.log(`✅ Migration completed for "${database}"`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? (err.stack ?? err.message) : String(err);

    logger.error(`❌ Migration failed for "${database}"`, message);

    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
      logger.log(`🔌 Connection closed for "${database}"`);
    }
  }
}
