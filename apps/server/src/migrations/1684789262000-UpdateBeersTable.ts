import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

interface BarrelResult {
  id: string;
}

export class UpdateBeersTable1684789262000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clean up any existing temporary tables first
    await queryRunner.query('DROP TABLE IF EXISTS "temporary_beer"');
    await queryRunner.query('DROP TABLE IF EXISTS "temp_beer"');

    // Drop the old nullable barrelId column if it exists
    try {
      await queryRunner.dropColumn('beer', 'barrelId');
    } catch {
      // Column might not exist, that's ok
    }

    // Add new barrelId column as nullable first
    await queryRunner.addColumn(
      'beer',
      new TableColumn({
        name: 'barrelId',
        type: 'uuid',
        isNullable: true, // Make it nullable initially
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'beer',
      new TableForeignKey({
        columnNames: ['barrelId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'barrels',
        onDelete: 'CASCADE',
      }),
    );

    // Get the oldest active barrel
    const oldestBarrel = (await queryRunner.query(
      `SELECT id FROM "barrels" WHERE "isActive" = 1 ORDER BY "createdAt" ASC LIMIT 1`,
    )) as BarrelResult[];

    // If we have an active barrel, assign all existing beers to it
    if (oldestBarrel && oldestBarrel.length > 0) {
      await queryRunner.query(
        `UPDATE "beer" SET "barrelId" = ? WHERE "barrelId" IS NULL`,
        [oldestBarrel[0].id],
      );
    }

    // Now make the column NOT NULL
    await queryRunner.query(`
      CREATE TABLE "temp_beer" (
        "id" varchar PRIMARY KEY NOT NULL,
        "participantId" varchar NOT NULL,
        "barrelId" uuid NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_ee652bb522a18605237c1fb2767" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_beer_barrel" FOREIGN KEY ("barrelId") REFERENCES "barrels" ("id") ON DELETE CASCADE
      );

      INSERT INTO "temp_beer" SELECT * FROM "beer";
      DROP TABLE "beer";
      ALTER TABLE "temp_beer" RENAME TO "beer";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up any existing temporary tables first
    await queryRunner.query('DROP TABLE IF EXISTS "temporary_beer"');
    await queryRunner.query('DROP TABLE IF EXISTS "temp_beer"');

    // Drop the foreign key
    const table = await queryRunner.getTable('beer');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('barrelId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('beer', foreignKey);
    }

    // Drop the barrelId column
    await queryRunner.dropColumn('beer', 'barrelId');

    // Add back the old nullable barrelId column
    await queryRunner.addColumn(
      'beer',
      new TableColumn({
        name: 'barrelId',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
