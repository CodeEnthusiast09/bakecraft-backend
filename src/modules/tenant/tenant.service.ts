import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import publicDatasource from '../public/public-orm.config';
import { DataSource } from 'typeorm';
import { Tenant } from '../public/entities/tenant.entity';
import { migrateTenantsSchema } from './scripts/migrate-tenants';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { SignUpDto } from './auth/dto/sign-up.dto';
import { getTenantConnection } from '../tenancy/tenancy.utils';
import { UsersService } from './users/users.service';
import { EmailService } from './email/email.service';
import { seedRoleAndDept } from './scripts/seed-roles-dept';

@Injectable()
export class TenantService implements OnModuleInit {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private dataSource: DataSource,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    // Ensure main DataSource is initialized once on module initialization
    if (!publicDatasource.isInitialized) {
      await publicDatasource.initialize();

      this.logger.log('Public datasource initialized ✅');
    }
  }

  async createTenant(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const { company_name, company_email, company_phone_number } =
      createTenantDto;

    const tenantSlug = company_name.toLowerCase().replace(/\s+/g, '-');

    const schema = `tenant_${tenantSlug}`;

    let savedTenant: Tenant | null = null;

    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      await publicDatasource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

      await migrateTenantsSchema(schema);

      const tenant = this.dataSource.manager.create(Tenant, {
        company_name,
        company_email,
        company_phone_number,
        slug: tenantSlug,
      });

      savedTenant = await this.dataSource.manager.save(tenant);

      const tenantDs = await getTenantConnection(savedTenant.id);

      await seedRoleAndDept(tenantDs);

      this.logger.log(`Tenant ${company_name} created successfully`);

      return savedTenant;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Error during tenant creation`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        this.logger.warn(`⚠️ Rolling back: dropping schema "${schema}"`);
        await publicDatasource.query(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
        );
      } catch (dropErr: unknown) {
        this.logger.error(
          `❌ Failed to drop schema "${schema}" during rollback`,
          dropErr instanceof Error ? dropErr.stack : String(dropErr),
        );
      }

      if (error instanceof ConflictException) throw error;

      throw new InternalServerErrorException('Failed to create tenant');
    }
  }

  // async createTenant(createTenantDto: CreateTenantDto, signUpDto: SignUpDto) {
  //   const { company_name, company_email, company_phone_number } =
  //     createTenantDto;
  //
  //   const tenantSlug = company_name.toLowerCase().replace(/\s+/g, '-');
  //
  //   const dbName = `tenant_${tenantSlug}`;
  //
  //   let savedTenant: Tenant | null = null;
  //
  //   try {
  //     if (!this.dataSource.isInitialized) {
  //       await this.dataSource.initialize();
  //     }
  //
  //     const existingTenant = await this.dataSource.manager.findOne(Tenant, {
  //       where: { slug: tenantSlug },
  //     });
  //
  //     if (existingTenant) {
  //       throw new ConflictException(
  //         `Tenant with slug "${tenantSlug}" already exists`,
  //       );
  //     }
  //
  //     this.logger.log(`🛠 Creating database "${dbName}"`);
  //
  //     await publicDatasource.query(`
  //       CREATE DATABASE "${dbName}"
  //       WITH ENCODING 'UTF8'
  //       LC_COLLATE 'en_US.UTF-8'
  //       LC_CTYPE 'en_US.UTF-8'
  //       TEMPLATE template0;
  //     `);
  //
  //     await migrateTenantsDatabase(dbName);
  //
  //     const tenant = this.dataSource.manager.create(Tenant, {
  //       company_name,
  //       company_email,
  //       company_phone_number,
  //       slug: tenantSlug,
  //     });
  //
  //     savedTenant = await this.dataSource.manager.save(tenant);
  //
  //     const tenantDs = await getTenantConnection(savedTenant.id);
  //
  //     const userService = new UsersService(tenantDs);
  //
  //     const savedUser = await userService.create(signUpDto);
  //
  //     await this.emailService.sendWelcomeEmail(
  //       savedUser.email,
  //       savedUser.first_name,
  //       savedTenant.slug,
  //     );
  //
  //     this.logger.log(`Tenant "${company_name}" created successfully ✅`);
  //
  //     return { tenant: savedTenant, user: savedUser };
  //   } catch (error: unknown) {
  //     this.logger.error(
  //       `❌ Error during tenant creation`,
  //       error instanceof Error ? error.stack : String(error),
  //     );
  //
  //     try {
  //       this.logger.warn(`⚠️ Rolling back: dropping database "${dbName}"`);
  //
  //       await publicDatasource.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  //     } catch (dropErr: unknown) {
  //       this.logger.error(
  //         `❌ Failed to drop database "${dbName}" during rollback`,
  //         dropErr instanceof Error ? dropErr.stack : String(dropErr),
  //       );
  //     }
  //
  //     if (error instanceof ConflictException) throw error;
  //
  //     throw new InternalServerErrorException('Failed to create tenant');
  //   }
  // }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    const tenant = await this.dataSource.manager.findOne(Tenant, {
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }

    return tenant;
  }

  async getTenantById(id: string): Promise<Tenant> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    const tenant = await this.dataSource.manager.findOne(Tenant, {
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    return tenant;
  }
}
