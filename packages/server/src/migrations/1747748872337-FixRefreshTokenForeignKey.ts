import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRefreshTokenForeignKey1747748872337
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing refresh_token table
    await queryRunner.dropTable('refresh_token', true);

    // Recreate the refresh_token table with correct foreign key
    await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" varchar PRIMARY KEY NOT NULL,
                "token" varchar NOT NULL,
                "expiresAt" datetime NOT NULL,
                "isRevoked" boolean NOT NULL DEFAULT (0),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "userId" integer NOT NULL,
                "replacedByToken" varchar,
                "reasonRevoked" varchar,
                CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

    // Recreate the indices
    await queryRunner.query(`
            CREATE INDEX "IDX_c31d0a2f38e6e99110df62ab0a" ON "refresh_token" ("token")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_refresh_token_token" ON "refresh_token" ("token")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_token', true);
  }
}
