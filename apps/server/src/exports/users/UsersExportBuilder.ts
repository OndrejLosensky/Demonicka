import { Injectable } from '@nestjs/common';
import type { StreamableFile } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelRenderer } from '../excel/ExcelRenderer';

/**
 * Users Excel export: all users (SUPER_ADMIN only).
 * Stable sheet/column layout for v4 user import.
 */
@Injectable()
export class UsersExportBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(): Promise<StreamableFile> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { username: 'asc' },
    });

    const renderer = new ExcelRenderer();
    renderer.addTableSheet({
      name: 'Users',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (u) => u.id },
        { header: 'username', key: 'username', width: 22, value: (u) => u.username ?? '' },
        { header: 'firstName', key: 'firstName', width: 18, value: (u) => u.firstName ?? '' },
        { header: 'lastName', key: 'lastName', width: 18, value: (u) => u.lastName ?? '' },
        { header: 'name', key: 'name', width: 22, value: (u) => u.name ?? '' },
        { header: 'email', key: 'email', width: 28, value: (u) => u.email ?? '' },
        { header: 'gender', key: 'gender', width: 10, value: (u) => u.gender },
        { header: 'role', key: 'role', width: 14, value: (u) => u.role },
        {
          header: 'isRegistrationComplete',
          key: 'isRegistrationComplete',
          width: 22,
          value: (u) => u.isRegistrationComplete,
        },
        {
          header: 'isTwoFactorEnabled',
          key: 'isTwoFactorEnabled',
          width: 18,
          value: (u) => u.isTwoFactorEnabled,
        },
        { header: 'canLogin', key: 'canLogin', width: 10, value: (u) => u.canLogin },
        {
          header: 'lastAdminLogin',
          key: 'lastAdminLogin',
          width: 22,
          value: (u) => u.lastAdminLogin ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'createdAt',
          key: 'createdAt',
          width: 22,
          value: (u) => u.createdAt,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'updatedAt',
          key: 'updatedAt',
          width: 22,
          value: (u) => u.updatedAt,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: users,
    });

    const filename = 'users_export.xlsx';
    return renderer.toStreamableFile(filename);
  }
}
