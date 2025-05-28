import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNameColumn1748441344603 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create new table without the name column
        await queryRunner.query(`
            CREATE TABLE "temporary_users" (
                "id" varchar PRIMARY KEY NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar,
                "gender" varchar NOT NULL,
                "beerCount" integer NOT NULL DEFAULT (0),
                "lastBeerTime" datetime,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "deletedAt" datetime
            )
        `);

        // Copy data from old table to new table
        await queryRunner.query(`
            INSERT INTO "temporary_users" (
                "id", "username", "password", "gender", "beerCount",
                "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
            )
            SELECT
                "id", "username", "password", "gender", "beerCount",
                "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
            FROM "users"
        `);

        // Drop old table
        await queryRunner.query('DROP TABLE "users"');

        // Rename temporary table to original name
        await queryRunner.query('ALTER TABLE "temporary_users" RENAME TO "users"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Create new table with the name column
        await queryRunner.query(`
            CREATE TABLE "temporary_users" (
                "id" varchar PRIMARY KEY NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar,
                "name" varchar NOT NULL,
                "gender" varchar NOT NULL,
                "beerCount" integer NOT NULL DEFAULT (0),
                "lastBeerTime" datetime,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "deletedAt" datetime
            )
        `);

        // Copy data from old table to new table, setting a default value for name
        await queryRunner.query(`
            INSERT INTO "temporary_users" (
                "id", "username", "password", "name", "gender", "beerCount",
                "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
            )
            SELECT
                "id", "username", "password", "username", "gender", "beerCount",
                "lastBeerTime", "createdAt", "updatedAt", "deletedAt"
            FROM "users"
        `);

        // Drop old table
        await queryRunner.query('DROP TABLE "users"');

        // Rename temporary table to original name
        await queryRunner.query('ALTER TABLE "temporary_users" RENAME TO "users"');
    }

}
