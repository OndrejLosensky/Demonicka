import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeNameNullable1748441344604 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table with nullable name
    await queryRunner.query(`
      CREATE TABLE "temporary_users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "username" varchar NOT NULL,
        "password" varchar,
        "name" varchar,
        "gender" varchar CHECK( gender IN ('MALE','FEMALE') ) NOT NULL,
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
      )
    `);

    // Copy data from old table
    await queryRunner.query(`
      INSERT INTO "temporary_users" (
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
      )
      SELECT
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
      FROM "users"
    `);

    // Drop old table
    await queryRunner.query('DROP TABLE "users"');

    // Rename temporary table
    await queryRunner.query('ALTER TABLE "temporary_users" RENAME TO "users"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create temporary table with NOT NULL name
    await queryRunner.query(`
      CREATE TABLE "temporary_users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "username" varchar NOT NULL,
        "password" varchar,
        "name" varchar NOT NULL,
        "gender" varchar CHECK( gender IN ('MALE','FEMALE') ) NOT NULL,
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
      )
    `);

    // Copy data from old table, using username as name if name is NULL
    await queryRunner.query(`
      INSERT INTO "temporary_users" (
        "id", "username", "password", "name", "gender", "beerCount",
        "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
      )
      SELECT
        "id", "username", "password", COALESCE("name", "username"), "gender", "beerCount",
        "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
      FROM "users"
    `);

    // Drop old table
    await queryRunner.query('DROP TABLE "users"');

    // Rename temporary table
    await queryRunner.query('ALTER TABLE "temporary_users" RENAME TO "users"');
  }
} 