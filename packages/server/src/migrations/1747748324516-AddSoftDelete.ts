import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSoftDelete1747748324516 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const deletedAtColumn = new TableColumn({
      name: 'deletedAt',
      type: 'datetime',
      isNullable: true,
    });

    await queryRunner.addColumn('participants', deletedAtColumn);
    await queryRunner.addColumn('beers', deletedAtColumn);
    await queryRunner.addColumn('barrels', deletedAtColumn);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('participants', 'deletedAt');
    await queryRunner.dropColumn('beers', 'deletedAt');
    await queryRunner.dropColumn('barrels', 'deletedAt');
  }
}
