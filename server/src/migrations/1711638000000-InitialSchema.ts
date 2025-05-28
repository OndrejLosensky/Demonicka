import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711638000000 implements MigrationInterface {
  name = 'InitialSchema1711638000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
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

    // Create refresh_tokens table
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
        CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create barrels table
    await queryRunner.query(`
      CREATE TABLE "barrels" (
        "id" varchar PRIMARY KEY NOT NULL,
        "size" integer CHECK( size IN (15,30,50) ) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT (1),
        "orderNumber" integer NOT NULL,
        "remainingBeers" integer NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime
      )
    `);

    // Create beers table
    await queryRunner.query(`
      CREATE TABLE "beers" (
        "id" varchar PRIMARY KEY NOT NULL,
        "userId" varchar NOT NULL,
        "barrelId" varchar,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        CONSTRAINT "FK_beers_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_beers_barrel" FOREIGN KEY ("barrelId") REFERENCES "barrels" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "beers"`);
    await queryRunner.query(`DROP TABLE "barrels"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
} 