import { MigrationInterface, QueryRunner, Table } from 'typeorm';

interface BarrelData {
  id: string;
  size: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AddBarrelOrderAndRemaining1684789261000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get existing data
    const barrels = (await queryRunner.query(
      `SELECT * FROM "barrels" ORDER BY "createdAt" ASC`,
    )) as BarrelData[];
    
    // Drop existing table
    await queryRunner.dropTable('barrels');

    // Create new table with all columns
    await queryRunner.createTable(
      new Table({
        name: 'barrels',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'size',
            type: 'integer',
            enum: ['15', '30', '50'],
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'orderNumber',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'remainingBeers',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Reinsert the data with new columns
    if (barrels && barrels.length > 0) {
      for (let i = 0; i < barrels.length; i++) {
        const barrel = barrels[i];
        await queryRunner.query(
          `INSERT INTO "barrels" 
           ("id", "size", "isActive", "orderNumber", "remainingBeers", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            barrel.id,
            barrel.size,
            barrel.isActive,
            i + 1,
            barrel.size * 2,
            barrel.createdAt,
            barrel.updatedAt,
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get existing data
    const barrels = (await queryRunner.query(
      `SELECT * FROM "barrels"`,
    )) as BarrelData[];
    
    // Drop the new table
    await queryRunner.dropTable('barrels');

    // Recreate the original table
    await queryRunner.createTable(
      new Table({
        name: 'barrels',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'size',
            type: 'integer',
            enum: ['15', '30', '50'],
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Reinsert the original data
    if (barrels && barrels.length > 0) {
      for (const barrel of barrels) {
        await queryRunner.query(
          `INSERT INTO "barrels" ("id", "size", "isActive", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?)`,
          [barrel.id, barrel.size, barrel.isActive, barrel.createdAt, barrel.updatedAt],
        );
      }
    }
  }
} 