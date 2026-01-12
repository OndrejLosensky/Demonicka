import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventsTable1711638000001 implements MigrationInterface {
    name = 'AddEventsTable1711638000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "event" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "startDate" datetime NOT NULL,
                "endDate" datetime,
                "isActive" boolean NOT NULL DEFAULT (0),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "deletedAt" datetime
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_users" (
                "event_id" varchar NOT NULL,
                "user_id" varchar NOT NULL,
                PRIMARY KEY ("event_id", "user_id"),
                CONSTRAINT "FK_event_users_event" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_event_users_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "event_barrels" (
                "event_id" varchar NOT NULL,
                "barrel_id" varchar NOT NULL,
                PRIMARY KEY ("event_id", "barrel_id"),
                CONSTRAINT "FK_event_barrels_event" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_event_barrels_barrel" FOREIGN KEY ("barrel_id") REFERENCES "barrels" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "event_barrels"`);
        await queryRunner.query(`DROP TABLE "event_users"`);
        await queryRunner.query(`DROP TABLE "event"`);
    }
} 