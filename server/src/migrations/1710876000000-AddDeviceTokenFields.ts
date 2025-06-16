import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceTokenFields1710876000000 implements MigrationInterface {
  name = 'AddDeviceTokenFields1710876000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device_tokens" 
      ADD COLUMN "isBiometricEnabled" boolean DEFAULT false,
      ADD COLUMN "biometricType" varchar,
      ADD COLUMN "isActive" boolean DEFAULT true,
      ADD COLUMN "lastUsed" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device_tokens" 
      DROP COLUMN "isBiometricEnabled",
      DROP COLUMN "biometricType",
      DROP COLUMN "isActive",
      DROP COLUMN "lastUsed"
    `);
  }
} 