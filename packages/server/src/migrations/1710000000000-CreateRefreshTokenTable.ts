import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateRefreshTokenTable1710000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_token',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'isRevoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'replacedByToken',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'reasonRevoked',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'refresh_token',
      new TableIndex({
        name: 'IDX_refresh_token_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'refresh_token',
      new TableForeignKey({
        name: 'FK_refresh_token_user',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_token');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('refresh_token', foreignKey);
      }
    }
    await queryRunner.dropIndex('refresh_token', 'IDX_refresh_token_token');
    await queryRunner.dropTable('refresh_token');
  }
}
