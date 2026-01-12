import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class AddTotalBeersToBarrels1749975358935 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'barrels',
            new TableColumn({
                name: 'totalBeers',
                type: 'integer',
                isNullable: false,
                default: 0
            })
        );

        // Update existing barrels to set totalBeers based on size
        await queryRunner.query(`
            UPDATE barrels 
            SET totalBeers = size * 2 
            WHERE totalBeers = 0 OR totalBeers IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('barrels', 'totalBeers');
    }
}
