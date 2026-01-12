import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUsernameUnique1749936460050 implements MigrationInterface {
  name = 'RemoveUsernameUnique1749936460050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint from the username column
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
        "firstName" varchar,
        "lastName" varchar
      )
    `);

    await queryRunner.query(`
      INSERT INTO "temporary_users" 
      SELECT * FROM "users"
    `);

    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the unique constraint
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
        "firstName" varchar,
        "lastName" varchar,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "temporary_users" 
      SELECT * FROM "users"
    `);

    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
  }
} 