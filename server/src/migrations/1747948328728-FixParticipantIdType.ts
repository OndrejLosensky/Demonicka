import { MigrationInterface, QueryRunner } from "typeorm";

export class FixParticipantIdType1747948328728 implements MigrationInterface {
    name = 'FixParticipantIdType1747948328728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_barrels" ("id" varchar PRIMARY KEY NOT NULL, "size" varchar CHECK( "size" IN ('15','30','50') ) NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "orderNumber" integer NOT NULL, "remainingBeers" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_barrels"("id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt") SELECT "id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt" FROM "barrels"`);
        await queryRunner.query(`DROP TABLE "barrels"`);
        await queryRunner.query(`ALTER TABLE "temporary_barrels" RENAME TO "barrels"`);
        await queryRunner.query(`CREATE TABLE "temporary_participants" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "gender" varchar CHECK( "gender" IN ('MALE','FEMALE') ) NOT NULL, "beerCount" integer NOT NULL DEFAULT (0), "lastBeerTime" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_a7022312e5e867b7da354b1e28f" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "temporary_participants"("id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt" FROM "participants"`);
        await queryRunner.query(`DROP TABLE "participants"`);
        await queryRunner.query(`ALTER TABLE "temporary_participants" RENAME TO "participants"`);
        await queryRunner.query(`CREATE TABLE "temporary_barrels" ("id" varchar PRIMARY KEY NOT NULL, "size" varchar CHECK( "size" IN ('15','30','50') ) NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "orderNumber" integer NOT NULL, "remainingBeers" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_barrels"("id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt") SELECT "id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt" FROM "barrels"`);
        await queryRunner.query(`DROP TABLE "barrels"`);
        await queryRunner.query(`ALTER TABLE "temporary_barrels" RENAME TO "barrels"`);
        await queryRunner.query(`CREATE TABLE "temporary_participants" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "gender" varchar CHECK( "gender" IN ('MALE','FEMALE') ) NOT NULL, "beerCount" integer NOT NULL DEFAULT (0), "lastBeerTime" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_a7022312e5e867b7da354b1e28f" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "temporary_participants"("id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt" FROM "participants"`);
        await queryRunner.query(`DROP TABLE "participants"`);
        await queryRunner.query(`ALTER TABLE "temporary_participants" RENAME TO "participants"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participants" RENAME TO "temporary_participants"`);
        await queryRunner.query(`CREATE TABLE "participants" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "gender" varchar CHECK( "gender" IN ('MALE','FEMALE') ) NOT NULL, "beerCount" integer NOT NULL DEFAULT (0), "lastBeerTime" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_a7022312e5e867b7da354b1e28f" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "participants"("id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt" FROM "temporary_participants"`);
        await queryRunner.query(`DROP TABLE "temporary_participants"`);
        await queryRunner.query(`ALTER TABLE "barrels" RENAME TO "temporary_barrels"`);
        await queryRunner.query(`CREATE TABLE "barrels" ("id" varchar PRIMARY KEY NOT NULL, "size" varchar CHECK( "size" IN ('15','30','50') ) NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "orderNumber" integer NOT NULL, "remainingBeers" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "barrels"("id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt") SELECT "id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt" FROM "temporary_barrels"`);
        await queryRunner.query(`DROP TABLE "temporary_barrels"`);
        await queryRunner.query(`ALTER TABLE "participants" RENAME TO "temporary_participants"`);
        await queryRunner.query(`CREATE TABLE "participants" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "gender" varchar CHECK( "gender" IN ('MALE','FEMALE') ) NOT NULL, "beerCount" integer NOT NULL DEFAULT (0), "lastBeerTime" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_a7022312e5e867b7da354b1e28f" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "participants"("id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "gender", "beerCount", "lastBeerTime", "createdAt", "updatedAt", "deletedAt" FROM "temporary_participants"`);
        await queryRunner.query(`DROP TABLE "temporary_participants"`);
        await queryRunner.query(`ALTER TABLE "barrels" RENAME TO "temporary_barrels"`);
        await queryRunner.query(`CREATE TABLE "barrels" ("id" varchar PRIMARY KEY NOT NULL, "size" varchar CHECK( "size" IN ('15','30','50') ) NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "orderNumber" integer NOT NULL, "remainingBeers" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "barrels"("id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt") SELECT "id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt", "deletedAt" FROM "temporary_barrels"`);
        await queryRunner.query(`DROP TABLE "temporary_barrels"`);
    }

}
