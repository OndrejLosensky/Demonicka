import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyUserParticipant1711638000000 implements MigrationInterface {
  name = 'UnifyUserParticipant1711638000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table one by one (SQLite limitation)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "registrationToken" varchar UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "isRegistrationComplete" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "gender" varchar CHECK (gender IN ('MALE', 'FEMALE'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "beerCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "lastBeerTime" datetime`,
    );

    // Make email and password nullable for incomplete registrations
    await queryRunner.query(
      `CREATE TABLE "users_temp" AS SELECT * FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar PRIMARY KEY,
        "username" varchar UNIQUE,
        "password" varchar,
        "email" varchar UNIQUE,
        "firstName" varchar,
        "lastName" varchar,
        "registrationToken" varchar UNIQUE,
        "isRegistrationComplete" boolean NOT NULL DEFAULT false,
        "gender" varchar CHECK (gender IN ('MALE', 'FEMALE')),
        "beerCount" integer NOT NULL DEFAULT 0,
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`INSERT INTO "users" SELECT * FROM "users_temp"`);
    await queryRunner.query(`DROP TABLE "users_temp"`);

    // Drop the participants table since we're moving everything to users
    await queryRunner.query(`DROP TABLE IF EXISTS "participants"`);

    // Update beer table to reference users instead of participants
    await queryRunner.query(`
      CREATE TABLE "beers_temp" AS SELECT * FROM "beers"
    `);
    await queryRunner.query(`DROP TABLE "beers"`);
    await queryRunner.query(`
      CREATE TABLE "beers" (
        "id" varchar PRIMARY KEY,
        "userId" varchar REFERENCES "users"("id") ON DELETE CASCADE,
        "barrelId" varchar REFERENCES "barrels"("id") ON DELETE CASCADE,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime
      )
    `);
    await queryRunner.query(`
      INSERT INTO "beers" ("id", "userId", "barrelId", "createdAt", "deletedAt")
      SELECT "id", "participantId" as "userId", "barrelId", "createdAt", "deletedAt"
      FROM "beers_temp"
    `);
    await queryRunner.query(`DROP TABLE "beers_temp"`);

    // Update event_participants junction table to reference users
    await queryRunner.query(`
      CREATE TABLE "event_participants_temp" AS SELECT * FROM "event_participants"
    `);
    await queryRunner.query(`DROP TABLE "event_participants"`);
    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "event_id" varchar NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        PRIMARY KEY ("event_id", "user_id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "event_participants" ("event_id", "user_id")
      SELECT "event_id", "participant_id" as "user_id"
      FROM "event_participants_temp"
    `);
    await queryRunner.query(`DROP TABLE "event_participants_temp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore participants table
    await queryRunner.query(`
      CREATE TABLE "participants" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "gender" varchar CHECK (gender IN ('MALE', 'FEMALE')) NOT NULL,
        "beerCount" integer NOT NULL DEFAULT 0,
        "lastBeerTime" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime
      )
    `);

    // Restore beer table to original state
    await queryRunner.query(`
      CREATE TABLE "beers_temp" AS SELECT * FROM "beers"
    `);
    await queryRunner.query(`DROP TABLE "beers"`);
    await queryRunner.query(`
      CREATE TABLE "beers" (
        "id" varchar PRIMARY KEY,
        "participantId" varchar REFERENCES "participants"("id") ON DELETE CASCADE,
        "barrelId" varchar REFERENCES "barrels"("id") ON DELETE CASCADE,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime
      )
    `);
    await queryRunner.query(`
      INSERT INTO "beers" ("id", "participantId", "barrelId", "createdAt", "deletedAt")
      SELECT "id", "userId" as "participantId", "barrelId", "createdAt", "deletedAt"
      FROM "beers_temp"
    `);
    await queryRunner.query(`DROP TABLE "beers_temp"`);

    // Restore event_participants table to original state
    await queryRunner.query(`
      CREATE TABLE "event_participants_temp" AS SELECT * FROM "event_participants"
    `);
    await queryRunner.query(`DROP TABLE "event_participants"`);
    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "event_id" varchar NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "participant_id" varchar NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
        PRIMARY KEY ("event_id", "participant_id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "event_participants" ("event_id", "participant_id")
      SELECT "event_id", "user_id" as "participant_id"
      FROM "event_participants_temp"
    `);
    await queryRunner.query(`DROP TABLE "event_participants_temp"`);

    // Restore users table to original state
    await queryRunner.query(`
      CREATE TABLE "users_temp" AS SELECT * FROM "users"
    `);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar PRIMARY KEY,
        "username" varchar UNIQUE NOT NULL,
        "password" varchar NOT NULL,
        "email" varchar UNIQUE NOT NULL,
        "firstName" varchar NOT NULL,
        "lastName" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      INSERT INTO "users" ("id", "username", "password", "email", "firstName", "lastName", "createdAt", "updatedAt")
      SELECT "id", "username", "password", "email", "firstName", "lastName", "createdAt", "updatedAt"
      FROM "users_temp"
    `);
    await queryRunner.query(`DROP TABLE "users_temp"`);
  }
} 