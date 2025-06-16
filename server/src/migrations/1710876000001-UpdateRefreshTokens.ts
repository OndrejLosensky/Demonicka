import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRefreshTokens1710876000001 implements MigrationInterface {
  name = 'UpdateRefreshTokens1710876000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN "device_id" uuid REFERENCES "device_tokens"("id") ON DELETE CASCADE,
      RENAME COLUMN "reasonRevoked" TO "revokedReason"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN "device_id",
      RENAME COLUMN "revokedReason" TO "reasonRevoked"
    `);
  }
} 