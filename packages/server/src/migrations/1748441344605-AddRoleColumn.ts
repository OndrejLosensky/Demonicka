import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleColumn1748441344605 implements MigrationInterface {
  name = 'AddRoleColumn1748441344605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table with all fields including role
    await queryRunner.query(`
      CREATE TABLE "temporary_users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "username" varchar NOT NULL,
        "password" varchar,
        "name" varchar,
        "gender" varchar CHECK( gender IN ('MALE','FEMALE') ) NOT NULL,
        "role" varchar CHECK( role IN ('ADMIN','USER','PARTICIPANT') ) NOT NULL DEFAULT 'PARTICIPANT',
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "registrationToken" varchar UNIQUE,
        "isRegistrationComplete" boolean NOT NULL DEFAULT (0),
        "isTwoFactorEnabled" boolean NOT NULL DEFAULT (0),
        "twoFactorSecret" varchar,
        "isAdminLoginEnabled" boolean NOT NULL DEFAULT (0),
        "allowedIPs" text,
        "lastAdminLogin" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
      )
    `);

    // Copy data from the old table
    await queryRunner.query(`
      INSERT INTO "temporary_users" (
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "registrationToken", "isRegistrationComplete",
        "isTwoFactorEnabled", "twoFactorSecret", "isAdminLoginEnabled",
        "allowedIPs", "lastAdminLogin", "createdAt", "updatedAt", "deletedAt"
      )
      SELECT
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "registrationToken", "isRegistrationComplete",
        "isTwoFactorEnabled", "twoFactorSecret", "isAdminLoginEnabled",
        "allowedIPs", "lastAdminLogin", "createdAt", "updatedAt", "deletedAt"
      FROM "users"
    `);

    // Drop the old table
    await queryRunner.query('DROP TABLE "users"');

    // Rename the temporary table to the original name
    await queryRunner.query('ALTER TABLE "temporary_users" RENAME TO "users"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table without role column
    await queryRunner.query(`
      CREATE TABLE "temporary_users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "username" varchar NOT NULL,
        "password" varchar,
        "name" varchar,
        "gender" varchar CHECK( gender IN ('MALE','FEMALE') ) NOT NULL,
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "registrationToken" varchar UNIQUE,
        "isRegistrationComplete" boolean NOT NULL DEFAULT (0),
        "isTwoFactorEnabled" boolean NOT NULL DEFAULT (0),
        "twoFactorSecret" varchar,
        "isAdminLoginEnabled" boolean NOT NULL DEFAULT (0),
        "allowedIPs" text,
        "lastAdminLogin" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
      )
    `);

    // Copy data excluding role column
    await queryRunner.query(`
      INSERT INTO "temporary_users" (
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "registrationToken", "isRegistrationComplete",
        "isTwoFactorEnabled", "twoFactorSecret", "isAdminLoginEnabled",
        "allowedIPs", "lastAdminLogin", "createdAt", "updatedAt", "deletedAt"
      )
      SELECT
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "registrationToken", "isRegistrationComplete",
        "isTwoFactorEnabled", "twoFactorSecret", "isAdminLoginEnabled",
        "allowedIPs", "lastAdminLogin", "createdAt", "updatedAt", "deletedAt"
      FROM "users"
    `);

    // Drop the old table
    await queryRunner.query('DROP TABLE "users"');

    // Rename the temporary table to the original name
    await queryRunner.query('ALTER TABLE "temporary_users" RENAME TO "users"');
  }
} 