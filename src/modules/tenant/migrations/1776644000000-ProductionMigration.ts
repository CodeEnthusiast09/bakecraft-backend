// src/modules/tenant/migrations/1776644000000-ProductionMigration.ts
import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class ProductionMigration1776644000000 implements MigrationInterface {
  name = 'ProductionMigration1776644000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // raw_materials
    await queryRunner.query(`
      CREATE TYPE "${schema}"."material_unit_enum" AS ENUM (
        'kg', 'g', 'litres', 'ml', 'units', 'pieces'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."raw_materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "unit" "${schema}"."material_unit_enum" NOT NULL,
        "currentStock" numeric(10,3) NOT NULL DEFAULT 0,
        "reorderLevel" numeric(10,3) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_raw_materials_${schema}" PRIMARY KEY ("id")
      )
    `);

    // products
    await queryRunner.query(`
      CREATE TABLE "${schema}"."products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_products_${schema}" PRIMARY KEY ("id")
      )
    `);

    // recipes
    await queryRunner.query(`
      CREATE TABLE "${schema}"."recipes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "product_id" uuid,
        "raw_material_id" uuid,
        "quantityRequired" numeric(10,3) NOT NULL,
        "unit" "${schema}"."material_unit_enum" NOT NULL,
        CONSTRAINT "PK_recipes_${schema}" PRIMARY KEY ("id")
      )
    `);

    // production_configs
    await queryRunner.query(`
      CREATE TABLE "${schema}"."production_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "product_id" uuid,
        "expectedOutputQuantity" numeric(10,3) NOT NULL,
        "expectedOutputUnit" character varying NOT NULL,
        "productionTimeMinutes" integer NOT NULL,
        "expectedDowntimeMinutes" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_production_configs_${schema}" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_production_configs_product_${schema}" UNIQUE ("product_id")
      )
    `);

    // shift status enum
    await queryRunner.query(`
      CREATE TYPE "${schema}"."shift_status_enum" AS ENUM (
        'in_progress', 'completed', 'aborted'
      )
    `);

    // production_shifts
    await queryRunner.query(`
      CREATE TABLE "${schema}"."production_shifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "product_id" uuid,
        "startedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "completedAt" TIMESTAMP WITHOUT TIME ZONE,
        "actualOutputQuantity" numeric(10,3),
        "status" "${schema}"."shift_status_enum" NOT NULL DEFAULT 'in_progress',
        "notes" text,
        "created_by_id" uuid,
        CONSTRAINT "PK_production_shifts_${schema}" PRIMARY KEY ("id")
      )
    `);

    // production_shift_materials
    await queryRunner.query(`
      CREATE TABLE "${schema}"."production_shift_materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shift_id" uuid,
        "raw_material_id" uuid,
        "quantityUsed" numeric(10,3) NOT NULL,
        CONSTRAINT "PK_production_shift_materials_${schema}" PRIMARY KEY ("id")
      )
    `);

    // Foreign keys — recipes
    await queryRunner.query(`
      ALTER TABLE "${schema}"."recipes"
        ADD CONSTRAINT "FK_recipes_product_${schema}"
        FOREIGN KEY ("product_id") REFERENCES "${schema}"."products"("id")
        ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."recipes"
        ADD CONSTRAINT "FK_recipes_raw_material_${schema}"
        FOREIGN KEY ("raw_material_id") REFERENCES "${schema}"."raw_materials"("id")
        ON DELETE CASCADE
    `);

    // Foreign keys — production_configs
    await queryRunner.query(`
      ALTER TABLE "${schema}"."production_configs"
        ADD CONSTRAINT "FK_production_configs_product_${schema}"
        FOREIGN KEY ("product_id") REFERENCES "${schema}"."products"("id")
        ON DELETE CASCADE
    `);

    // Foreign keys — production_shifts
    await queryRunner.query(`
      ALTER TABLE "${schema}"."production_shifts"
        ADD CONSTRAINT "FK_production_shifts_product_${schema}"
        FOREIGN KEY ("product_id") REFERENCES "${schema}"."products"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."production_shifts"
        ADD CONSTRAINT "FK_production_shifts_user_${schema}"
        FOREIGN KEY ("created_by_id") REFERENCES "${schema}"."users"("id")
        ON DELETE SET NULL
    `);

    // Foreign keys — production_shift_materials
    await queryRunner.query(`
      ALTER TABLE "${schema}"."production_shift_materials"
        ADD CONSTRAINT "FK_shift_materials_shift_${schema}"
        FOREIGN KEY ("shift_id") REFERENCES "${schema}"."production_shifts"("id")
        ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."production_shift_materials"
        ADD CONSTRAINT "FK_shift_materials_raw_material_${schema}"
        FOREIGN KEY ("raw_material_id") REFERENCES "${schema}"."raw_materials"("id")
        ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    await queryRunner.query(
      `ALTER TABLE "${schema}"."production_shift_materials" DROP CONSTRAINT "FK_shift_materials_raw_material_${schema}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."production_shift_materials" DROP CONSTRAINT "FK_shift_materials_shift_${schema}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."production_shifts" DROP CONSTRAINT "FK_production_shifts_user_${schema}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."production_shifts" DROP CONSTRAINT "FK_production_shifts_product_${schema}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."production_configs" DROP CONSTRAINT "FK_production_configs_product_${schema}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."recipes" DROP CONSTRAINT "FK_recipes_raw_material_${schema}"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."recipes" DROP CONSTRAINT "FK_recipes_product_${schema}"`,
    );

    await queryRunner.query(
      `DROP TABLE "${schema}"."production_shift_materials"`,
    );
    await queryRunner.query(`DROP TABLE "${schema}"."production_shifts"`);
    await queryRunner.query(`DROP TABLE "${schema}"."production_configs"`);
    await queryRunner.query(`DROP TABLE "${schema}"."recipes"`);
    await queryRunner.query(`DROP TABLE "${schema}"."products"`);
    await queryRunner.query(`DROP TABLE "${schema}"."raw_materials"`);

    await queryRunner.query(`DROP TYPE "${schema}"."shift_status_enum"`);
    await queryRunner.query(`DROP TYPE "${schema}"."material_unit_enum"`);
  }
}
