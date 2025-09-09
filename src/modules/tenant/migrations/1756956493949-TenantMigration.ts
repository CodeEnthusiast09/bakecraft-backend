import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class TenantMigration1756956493949 implements MigrationInterface {
  name = 'TenantMigration1756956493949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // Create new tables
    await queryRunner.query(
      `CREATE TABLE "${schema}"."departments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "created_by_id" uuid,
        CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "${schema}"."roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "created_by_id" uuid,
        CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "${schema}"."notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "message" character varying NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "type" character varying,
        "recipient_id" uuid,
        "triggered_by_id" uuid,
        CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "${schema}"."invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "department" character varying NOT NULL,
        "email" character varying NOT NULL,
        "role" character varying NOT NULL,
        "invited_by_id" uuid,
        CONSTRAINT "PK_aa52e96b44a714372f4dd31a0af" PRIMARY KEY ("id")
      )`,
    );

    // Add missing columns to "users" before constraints
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD COLUMN "department_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD COLUMN "role_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD COLUMN "invited_by_id" uuid`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "${schema}"."departments" ADD CONSTRAINT "FK_c92e8cfee06c8e18abd172ea9e1" FOREIGN KEY ("created_by_id") REFERENCES "${schema}"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."roles" ADD CONSTRAINT "FK_4a4bff0f02e88cbdf770241ca8f" FOREIGN KEY ("created_by_id") REFERENCES "${schema}"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD CONSTRAINT "FK_0921d1972cf861d568f5271cd85" FOREIGN KEY ("department_id") REFERENCES "${schema}"."departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "${schema}"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" ADD CONSTRAINT "FK_37245f5ef28fdaba1695141b59f" FOREIGN KEY ("invited_by_id") REFERENCES "${schema}"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."notifications" ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY ("recipient_id") REFERENCES "${schema}"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."notifications" ADD CONSTRAINT "FK_d1581251e41e9186ed75f28d0f0" FOREIGN KEY ("triggered_by_id") REFERENCES "${schema}"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."invites" ADD CONSTRAINT "FK_997b4c1cbb58bd9467ab0f8e0e3" FOREIGN KEY ("invited_by_id") REFERENCES "${schema}"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;

    // Drop FKs
    await queryRunner.query(
      `ALTER TABLE "${schema}"."invites" DROP CONSTRAINT "FK_997b4c1cbb58bd9467ab0f8e0e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."notifications" DROP CONSTRAINT "FK_d1581251e41e9186ed75f28d0f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."notifications" DROP CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP CONSTRAINT "FK_37245f5ef28fdaba1695141b59f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP CONSTRAINT "FK_0921d1972cf861d568f5271cd85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."roles" DROP CONSTRAINT "FK_4a4bff0f02e88cbdf770241ca8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."departments" DROP CONSTRAINT "FK_c92e8cfee06c8e18abd172ea9e1"`,
    );

    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP COLUMN "invited_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP COLUMN "role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${schema}"."users" DROP COLUMN "department_id"`,
    );

    await queryRunner.query(`DROP TABLE "${schema}"."invites"`);
    await queryRunner.query(`DROP TABLE "${schema}"."notifications"`);
    await queryRunner.query(`DROP TABLE "${schema}"."roles"`);
    await queryRunner.query(`DROP TABLE "${schema}"."departments"`);
  }
}
