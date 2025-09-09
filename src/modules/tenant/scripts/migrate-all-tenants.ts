import { DataSource } from 'typeorm';
import { publicConfig } from 'src/modules/public/public-orm.config';
import { migrateTenantsSchema } from './migrate-tenants';

interface TenantSchema {
  slug: string;
}

async function migrateAllSchemas() {
  const publicDs = new DataSource(publicConfig);

  await publicDs.initialize();

  const tenants: TenantSchema[] = await publicDs.query(
    `SELECT slug FROM tenants`,
  );

  console.log(`Found ${tenants.length} tenant schemas`);

  for (const { slug } of tenants) {
    await migrateTenantsSchema(`tenant_${slug}`);
  }

  await publicDs.destroy();
}

migrateAllSchemas().catch((err) => {
  console.error(err);
  process.exit(1);
});
