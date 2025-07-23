import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRefreshTokensTableName1749975358936 implements MigrationInterface {
  name = 'FixRefreshTokensTableName1749975358936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old table if it exists (either name)
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    // Create the table with the correct name (plural)
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
        CONSTRAINT "FK_610102b60fea1a4e35c445e4167" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
} 