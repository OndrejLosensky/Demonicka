import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeNamesNullable20250520152809 implements MigrationInterface {
  name = 'MakeNamesNullable20250520152809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table
    await queryRunner.query(`
            CREATE TABLE "temporary_users" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar NOT NULL,
                "firstName" varchar,
                "lastName" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
            )
        `);

    // Copy data
    await queryRunner.query(`
            INSERT INTO "temporary_users"(
                "id", "username", "password", "email", 
                "firstName", "lastName", "createdAt", "updatedAt"
            ) 
            SELECT 
                "id", "username", "password", "email",
                "firstName", "lastName", "createdAt", "updatedAt"
            FROM "users"
        `);

    // Drop old table
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Rename temporary table
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // If we need to revert, make the columns required again
    await queryRunner.query(`
            CREATE TABLE "temporary_users" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
            )
        `);

    // Copy data
    await queryRunner.query(`
            INSERT INTO "temporary_users"(
                "id", "username", "password", "email",
                "firstName", "lastName", "createdAt", "updatedAt"
            )
            SELECT 
                "id", "username", "password", "email",
                COALESCE("firstName", ''), COALESCE("lastName", ''),
                "createdAt", "updatedAt"
            FROM "users"
        `);

    // Drop old table
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Rename temporary table
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
  }
}
