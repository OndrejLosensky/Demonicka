import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveParticipantNameUnique1747949150411
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_a7022312e5e867b7da354b1e28f"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_a7022312e5e867b7da354b1e28f" ON "participants" ("name") WHERE "deletedAt" IS NULL',
    );
  }
}
