import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAchievementsTables1750000000000 implements MigrationInterface {
  name = 'CreateAchievementsTables1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create achievements table
    await queryRunner.query(`
      CREATE TABLE "achievements" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "type" varchar NOT NULL,
        "category" varchar NOT NULL DEFAULT ('BEGINNER'),
        "targetValue" integer NOT NULL,
        "points" integer NOT NULL DEFAULT (0),
        "icon" varchar,
        "isActive" boolean NOT NULL DEFAULT (1),
        "isRepeatable" boolean NOT NULL DEFAULT (0),
        "maxCompletions" integer NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime
      )
    `);

    // Create user_achievements table
    await queryRunner.query(`
      CREATE TABLE "user_achievements" (
        "id" varchar PRIMARY KEY NOT NULL,
        "userId" varchar NOT NULL,
        "achievementId" varchar NOT NULL,
        "progress" integer NOT NULL DEFAULT (0),
        "isCompleted" boolean NOT NULL DEFAULT (0),
        "completedAt" datetime,
        "completionCount" integer NOT NULL DEFAULT (0),
        "lastProgressUpdate" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "deletedAt" datetime,
        CONSTRAINT "FK_user_achievements_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_achievements_achievement" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Insert default achievements
    await queryRunner.query(`
      INSERT INTO "achievements" ("id", "name", "description", "type", "category", "targetValue", "points", "icon") VALUES
        ('first-beer', 'První pivo', 'Vypij své první pivo', 'FIRST_BEER', 'BEGINNER', 1, 10, '🍺'),
        ('beers-10', 'Desítka', 'Vypij 10 piv', 'TOTAL_BEERS', 'BEGINNER', 10, 25, '🍺🍺'),
        ('beers-25', 'Pětadvacítka', 'Vypij 25 piv', 'TOTAL_BEERS', 'INTERMEDIATE', 25, 50, '🍺🍺🍺'),
        ('beers-50', 'Padesátka', 'Vypij 50 piv', 'TOTAL_BEERS', 'INTERMEDIATE', 50, 100, '🍺🍺🍺🍺'),
        ('beers-100', 'Stovka', 'Vypij 100 piv', 'TOTAL_BEERS', 'ADVANCED', 100, 250, '🍺🍺🍺🍺🍺'),
        ('event-beers-10', 'Eventový pijan', 'Vypij 10 piv na jedné akci', 'BEERS_IN_EVENT', 'INTERMEDIATE', 10, 75, '🎉'),
        ('event-beers-25', 'Eventový mistr', 'Vypij 25 piv na jedné akci', 'BEERS_IN_EVENT', 'ADVANCED', 25, 150, '🎉🎉'),
        ('hour-beers-5', 'Rychlý pijan', 'Vypij 5 piv za hodinu', 'BEERS_IN_HOUR', 'ADVANCED', 5, 100, '⚡'),
        ('events-5', 'Zkušený účastník', 'Zúčastni se 5 akcí', 'EVENTS_PARTICIPATED', 'INTERMEDIATE', 5, 75, '📅'),
        ('events-10', 'Veterán', 'Zúčastni se 10 akcí', 'EVENTS_PARTICIPATED', 'ADVANCED', 10, 150, '📅📅'),
        ('event-win', 'Vítěz', 'Vyhraj akci', 'EVENT_WIN', 'ADVANCED', 1, 200, '🏆'),
        ('consecutive-days-3', 'Třídenní série', 'Pij 3 dny po sobě', 'CONSECUTIVE_DAYS', 'INTERMEDIATE', 3, 50, '📆'),
        ('consecutive-days-7', 'Týdenní série', 'Pij 7 dní po sobě', 'CONSECUTIVE_DAYS', 'ADVANCED', 7, 150, '📆📆')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_achievements"`);
    await queryRunner.query(`DROP TABLE "achievements"`);
  }
} 