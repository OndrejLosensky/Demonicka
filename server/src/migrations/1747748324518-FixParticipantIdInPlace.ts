import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixParticipantIdInPlace1747748324518
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clean up any existing temporary tables
    await queryRunner.query('DROP TABLE IF EXISTS "temp_participants";');
    await queryRunner.query('DROP TABLE IF EXISTS "temp_beer";');

    // Create a temporary table with the correct structure
    await queryRunner.query(`
      CREATE TABLE "temp_participants" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "gender" varchar CHECK( "gender" IN ('MALE','FEMALE') ) NOT NULL,
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "deletedAt" datetime,
        CONSTRAINT "UQ_a7022312e5e867b7da354b1e28f" UNIQUE ("name")
      );
    `);

    // Copy data from the old table to the new one, converting integer IDs to strings
    await queryRunner.query(`
      INSERT INTO "temp_participants" (
        "id",
        "name",
        "gender",
        "beerCount",
        "lastBeerTime",
        "createdAt",
        "updatedAt",
        "deletedAt"
      )
      SELECT 
        CAST("id" AS TEXT),
        "name",
        "gender",
        "beerCount",
        "lastBeerTime",
        "createdAt",
        "updatedAt",
        "deletedAt"
      FROM "participants";
    `);

    // Create a temporary beers table with the correct structure
    await queryRunner.query(`
      CREATE TABLE "temp_beer" (
        "id" varchar PRIMARY KEY NOT NULL,
        "participantId" varchar NOT NULL,
        "barrelId" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "deletedAt" datetime,
        FOREIGN KEY ("participantId") REFERENCES "temp_participants" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("barrelId") REFERENCES "barrels" ("id") ON DELETE CASCADE
      );
    `);

    // Copy beer data, converting participantId to string
    await queryRunner.query(`
      INSERT INTO "temp_beer" (
        "id",
        "participantId",
        "barrelId",
        "createdAt",
        "deletedAt"
      )
      SELECT 
        "id",
        CAST("participantId" AS TEXT),
        "barrelId",
        "createdAt",
        "deletedAt"
      FROM "beer";
    `);

    // Drop the old tables and rename the temporary ones
    await queryRunner.query('DROP TABLE "beer";');
    await queryRunner.query('DROP TABLE "participants";');
    await queryRunner.query(
      'ALTER TABLE "temp_participants" RENAME TO "participants";',
    );
    await queryRunner.query('ALTER TABLE "temp_beer" RENAME TO "beer";');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Since we're converting IDs to strings, we can't safely revert this migration
    throw new Error('This migration cannot be reverted');
  }
}
