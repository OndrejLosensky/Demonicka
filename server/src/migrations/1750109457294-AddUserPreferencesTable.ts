import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPreferencesTable1750109457294 implements MigrationInterface {
  name = 'AddUserPreferencesTable1750109457294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" varchar PRIMARY KEY NOT NULL,
        "user_id" varchar NOT NULL,
        "pushNotificationsEnabled" boolean NOT NULL DEFAULT (1),
        "eventNotificationsEnabled" boolean NOT NULL DEFAULT (1),
        "achievementNotificationsEnabled" boolean NOT NULL DEFAULT (1),
        "friendActivityNotificationsEnabled" boolean NOT NULL DEFAULT (1),
        "theme" varchar NOT NULL DEFAULT ('system'),
        "language" varchar NOT NULL DEFAULT ('en'),
        "hapticFeedbackEnabled" boolean NOT NULL DEFAULT (1),
        "soundEnabled" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "REL_user_preferences_user" UNIQUE ("user_id"),
        CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_preferences"`);
  }
} 