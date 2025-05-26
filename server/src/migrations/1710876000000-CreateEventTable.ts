import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventTable1710876000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "event" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "startDate" datetime NOT NULL,
                "endDate" datetime,
                "isActive" boolean NOT NULL DEFAULT (1),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_participants" (
                "event_id" varchar NOT NULL,
                "participant_id" varchar NOT NULL,
                PRIMARY KEY ("event_id", "participant_id"),
                CONSTRAINT "FK_event_participants_event" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_event_participants_participant" FOREIGN KEY ("participant_id") REFERENCES "participants" ("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_barrels" (
                "event_id" varchar NOT NULL,
                "barrel_id" varchar NOT NULL,
                PRIMARY KEY ("event_id", "barrel_id"),
                CONSTRAINT "FK_event_barrels_event" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_event_barrels_barrel" FOREIGN KEY ("barrel_id") REFERENCES "barrel" ("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "event_barrels"`);
        await queryRunner.query(`DROP TABLE "event_participants"`);
        await queryRunner.query(`DROP TABLE "event"`);
    }
} 