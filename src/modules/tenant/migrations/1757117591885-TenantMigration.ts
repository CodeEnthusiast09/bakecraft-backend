import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class TenantMigration1757117591885 implements MigrationInterface {
  name = 'TenantMigration1757117591885';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    await queryRunner.query(
      `ALTER TABLE "${schema}"."departments" ADD CONSTRAINT "UQ_${schema}_users_department" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."roles" ADD CONSTRAINT "UQ_${schema}_users_role" UNIQUE ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    await queryRunner.query(
      `ALTER TABLE "${schema}"."roles" DROP CONSTRAINT "UQ_${schema}_users_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."departments" DROP CONSTRAINT "UQ_${schema}_users_department"`,
    );
  }
}
