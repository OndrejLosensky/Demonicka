import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixParticipantIdType1747748324517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a temporary table with the correct UUID structure
    await queryRunner.query(`
      CREATE TABLE "temp_participants" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "gender" varchar NOT NULL,
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "deletedAt" datetime
      );
    `);

    // Copy data from the old table to the new one, generating UUIDs for existing records
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
        lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || 
        substr(lower(hex(randomblob(2))),2) || '-' || 
        substr('89ab',abs(random()) % 4 + 1, 1) || 
        substr(lower(hex(randomblob(2))),2) || '-' || 
        lower(hex(randomblob(6))),
        "name",
        "gender",
        "beerCount",
        "lastBeerTime",
        "createdAt",
        "updatedAt",
        "deletedAt"
      FROM "participants";
    `);

    // Update the beers table to reference the new UUIDs
    await queryRunner.query(`
      CREATE TABLE "temp_beers" (
        "id" varchar PRIMARY KEY NOT NULL,
        "participantId" varchar NOT NULL,
        "barrelId" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "deletedAt" datetime,
        FOREIGN KEY ("participantId") REFERENCES "temp_participants" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("barrelId") REFERENCES "barrels" ("id") ON DELETE CASCADE
      );
    `);

    // Copy beer data, linking to the new participant UUIDs
    await queryRunner.query(`
      INSERT INTO "temp_beers" (
        "id",
        "participantId",
        "barrelId",
        "createdAt",
        "deletedAt"
      )
      SELECT 
        b."id",
        tp."id",
        b."barrelId",
        b."createdAt",
        b."deletedAt"
      FROM "beers" b
      JOIN "participants" p ON b."participantId" = p."id"
      JOIN "temp_participants" tp ON tp."name" = p."name";
    `);

    // Drop the old tables and rename the temporary ones
    await queryRunner.query('DROP TABLE "beers";');
    await queryRunner.query('DROP TABLE "participants";');
    await queryRunner.query(
      'ALTER TABLE "temp_participants" RENAME TO "participants";',
    );
    await queryRunner.query('ALTER TABLE "temp_beers" RENAME TO "beers";');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "beers" RENAME TO "temp_beers";');
    await queryRunner.query(
      'ALTER TABLE "participants" RENAME TO "temp_participants";',
    );
    await queryRunner.query(`
      CREATE TABLE "participants" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "name" varchar NOT NULL,
        "gender" varchar NOT NULL,
        "beerCount" integer NOT NULL DEFAULT (0),
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "deletedAt" datetime
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "beers" (
        "id" varchar PRIMARY KEY NOT NULL,
        "participantId" integer NOT NULL,
        "barrelId" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "deletedAt" datetime,
        FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("barrelId") REFERENCES "barrels" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query('DROP TABLE "temp_beers";');
    await queryRunner.query('DROP TABLE "temp_participants";');
  }
}
