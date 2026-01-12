import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoles1748441344606 implements MigrationInterface {
  name = 'AddUserRoles1748441344606';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add role column with default value
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "role" varchar CHECK( role IN ('ADMIN','USER','PARTICIPANT') ) NOT NULL DEFAULT 'PARTICIPANT'
    `);

    // Update existing users based on their registration status
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = CASE
        WHEN "isRegistrationComplete" = 1 THEN 'USER'
        ELSE 'PARTICIPANT'
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "role"
    `);
  }
} 