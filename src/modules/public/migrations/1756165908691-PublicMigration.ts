import { MigrationInterface, QueryRunner } from 'typeorm';

export class PublicMigration1756165908691 implements MigrationInterface {
  name = 'PublicMigration1756165908691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums first
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM ('pending', 'active', 'past_due', 'canceled', 'disabled')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."tenants_status_enum" AS ENUM ('pending', 'active', 'canceled', 'suspended')`,
    );

    // Create tables
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "plan_code" character varying(120) NOT NULL, "name" character varying(255) NOT NULL, "amount" integer NOT NULL, "interval" character varying(20) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'NGN', "active" boolean NOT NULL DEFAULT true, "paystack_plan_id" character varying(120), "description" text, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_95a73eac3071838b75e6840cd1" ON "plans" ("plan_code") `,
    );

    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "reference" character varying(120) NOT NULL, "customer_email" character varying(120) NOT NULL, "customer_code" character varying(120), "authorization_code" character varying(120), "subscription_code" character varying(120), "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'pending', "current_period_start" TIMESTAMP WITH TIME ZONE, "current_period_end" TIMESTAMP WITH TIME ZONE, "next_payment_date" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "tenantId" uuid, "plan_id" uuid, CONSTRAINT "REL_0c5fe8e5f9f4dd4a8c0134abc9" UNIQUE ("tenantId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_170a8e7c388939041319cdd533" ON "subscriptions" ("reference") `,
    );

    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "company_name" character varying NOT NULL, "company_email" character varying NOT NULL, "company_phone_number" character varying NOT NULL, "slug" character varying NOT NULL, "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_7e12ffd057038ee2c59cf7c760a" UNIQUE ("company_name"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "tenants"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_170a8e7c388939041319cdd533"`,
    );

    await queryRunner.query(`DROP TABLE "subscriptions"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_95a73eac3071838b75e6840cd1"`,
    );

    await queryRunner.query(`DROP TABLE "plans"`);

    // Drop enums last
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
  }
}
