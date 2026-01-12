import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertToUUID1747901592312 implements MigrationInterface {
  name = 'ConvertToUUID1747901592312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing refresh_tokens table as we'll recreate it
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    // Create temporary users table
    await queryRunner.query(
      `CREATE TABLE "temporary_users" AS SELECT * FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);

    // Create new users table with UUID
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" varchar PRIMARY KEY NOT NULL,
                "username" varchar NOT NULL,
                "email" varchar NOT NULL,
                "password" varchar NOT NULL,
                "firstName" varchar,
                "lastName" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
            )
        `);

    // Copy data with UUID
    await queryRunner.query(`
            INSERT INTO "users" ("id", "username", "email", "password", "firstName", "lastName", "createdAt", "updatedAt")
            SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || 
                   substr(hex(randomblob(2)),2) || '-' || 
                   substr('89ab',abs(random()) % 4 + 1, 1) ||
                   substr(hex(randomblob(2)),2) || '-' || 
                   hex(randomblob(6))) as "id",
                   "username", "email", "password", 
                   COALESCE("firstName", ''), 
                   COALESCE("lastName", ''),
                   "createdAt", "updatedAt"
            FROM "temporary_users"
        `);

    // Drop temporary table
    await queryRunner.query(`DROP TABLE "temporary_users"`);

    // Create new refresh_tokens table
    await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" varchar PRIMARY KEY NOT NULL,
                "token" varchar NOT NULL,
                "userId" varchar NOT NULL,
                "expiresAt" datetime NOT NULL,
                "isRevoked" boolean NOT NULL DEFAULT (0),
                "reasonRevoked" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_c31d0a2f38e6e99110df62ab0af" UNIQUE ("token"),
                CONSTRAINT "FK_610102b60fea1a4e35c445e4167" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop refresh_tokens table
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);

    // Create temporary users table
    await queryRunner.query(
      `CREATE TABLE "temporary_users" AS SELECT * FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);

    // Create users table with numeric IDs
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "email" varchar NOT NULL,
                "password" varchar NOT NULL,
                "firstName" varchar,
                "lastName" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
            )
        `);

    // Copy data back
    await queryRunner.query(`
            INSERT INTO "users" ("username", "email", "password", "firstName", "lastName", "createdAt", "updatedAt")
            SELECT "username", "email", "password", "firstName", "lastName", "createdAt", "updatedAt"
            FROM "temporary_users"
        `);

    // Drop temporary table
    await queryRunner.query(`DROP TABLE "temporary_users"`);
  }
}
