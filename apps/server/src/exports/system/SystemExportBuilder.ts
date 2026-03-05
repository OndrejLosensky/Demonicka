import { Injectable } from '@nestjs/common';
import type { StreamableFile } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelRenderer } from '../excel/ExcelRenderer';
import { EventDetailDataLoader } from '../event-detail/EventDetailDataLoader';
import { EventDetailExportBuilder } from '../event-detail/EventDetailExportBuilder';

/**
 * System-wide Excel export: Events summary sheet, all Users sheet,
 * then per-event detail sheets (same structure as single-event export) for v4 import.
 * SUPER_ADMIN only.
 */
@Injectable()
export class SystemExportBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventDetailLoader: EventDetailDataLoader,
    private readonly eventDetailExportBuilder: EventDetailExportBuilder,
  ) {}

  async build(): Promise<StreamableFile> {
    const renderer = new ExcelRenderer();

    const events = await this.prisma.event.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: 'desc' },
    });

    // 1) Events summary sheet
    renderer.addTableSheet({
      name: 'Events',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (e) => e.id },
        { header: 'name', key: 'name', width: 32, value: (e) => e.name },
        {
          header: 'startDate',
          key: 'startDate',
          width: 22,
          value: (e) => e.startDate,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'endDate',
          key: 'endDate',
          width: 22,
          value: (e) => e.endDate,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        { header: 'isActive', key: 'isActive', width: 10, value: (e) => e.isActive },
        {
          header: 'beerPongEnabled',
          key: 'beerPongEnabled',
          width: 16,
          value: (e) => e.beerPongEnabled,
        },
        {
          header: 'beerSizesEnabled',
          key: 'beerSizesEnabled',
          width: 16,
          value: (e) => e.beerSizesEnabled,
        },
        { header: 'beerPrice', key: 'beerPrice', width: 12, value: (e) => e.beerPrice },
        {
          header: 'createdAt',
          key: 'createdAt',
          width: 22,
          value: (e) => e.createdAt,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: events,
    });

    // 2) All users in the system (id, username, role, etc.)
    const allUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { username: 'asc' },
    });
    renderer.addTableSheet({
      name: 'Users',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (u) => u.id },
        { header: 'username', key: 'username', width: 22, value: (u) => u.username ?? '' },
        { header: 'firstName', key: 'firstName', width: 18, value: (u) => u.firstName ?? '' },
        { header: 'lastName', key: 'lastName', width: 18, value: (u) => u.lastName ?? '' },
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
      rows: allUsers,
    });

    // 3) Per-event detail sheets (same structure as single-event export for v4 import)
    for (let i = 0; i < events.length; i++) {
      const data = await this.eventDetailLoader.load(events[i].id);
      this.eventDetailExportBuilder.addSheetsTo(renderer, data, `_${i + 1}`);
    }

    const filename = 'system_export.xlsx';
    return renderer.toStreamableFile(filename);
  }
}
