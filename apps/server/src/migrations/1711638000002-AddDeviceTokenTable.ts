import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceTokenTable1711638000002 implements MigrationInterface {
  name = 'AddDeviceTokenTable1711638000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "device_token" (
        "id" varchar PRIMARY KEY NOT NULL,
        "token" varchar NOT NULL,
        "deviceType" varchar CHECK( deviceType IN ('ios', 'android', 'web') ) NOT NULL DEFAULT 'web',
        "deviceName" varchar,
        "deviceModel" varchar,
        "osVersion" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "lastUsed" datetime,
        "userId" varchar NOT NULL,
        "isAdminDevice" boolean NOT NULL DEFAULT (0),
        "biometricEnabled" boolean,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_device_token_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_device_token_token" ON "device_token" ("token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_device_token_token"`);
    await queryRunner.query(`DROP TABLE "device_token"`);
  }
} 