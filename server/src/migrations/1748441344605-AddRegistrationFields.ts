import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationFields1748441344605 implements MigrationInterface {
  name = 'AddRegistrationFields1748441344605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "registrationToken" varchar UNIQUE;
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "isRegistrationComplete" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "registrationToken";
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "isRegistrationComplete";
    `);
  }
} 