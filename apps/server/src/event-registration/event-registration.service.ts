import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventRegistration, EventRegistrationStatus } from '@prisma/client';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { randomBytes } from 'node:crypto';
import { ExcelRenderer } from '../exports/excel/ExcelRenderer';
import type { StreamableFile } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class EventRegistrationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a secure random token for event registration
   */
  generateRegistrationToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Open registration for an event - generates token if not exists
   */
  async openRegistration(eventId: string): Promise<{ token: string; link: string }> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    let token = event.registrationToken;
    if (!token) {
      token = this.generateRegistrationToken();
      await this.prisma.event.update({
        where: { id: eventId },
        data: { registrationToken: token, registrationEnabled: true },
      });
    } else {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { registrationEnabled: true },
      });
    }

    // Return link (frontend will construct full URL)
    return { token, link: `/register/event/${token}` };
  }

  /**
   * Close registration for an event
   */
  async closeRegistration(eventId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: { registrationEnabled: false },
    });
  }

  /**
   * Get event by registration token (public)
   */
  async getEventByToken(token: string): Promise<{ eventName: string; registrationEnabled: boolean; startDate: string; endDate: string }> {
    const event = await this.prisma.event.findUnique({
      where: { registrationToken: token },
      select: { name: true, registrationEnabled: true, startDate: true, endDate: true },
    });

    if (!event) {
      throw new NotFoundException('Invalid registration token');
    }

    if (!event.registrationEnabled) {
      throw new ForbiddenException('Registration is currently closed');
    }

    if (!event.endDate) {
      throw new BadRequestException('Event must have an end date for registration');
    }

    return {
      eventName: event.name,
      registrationEnabled: event.registrationEnabled,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
    };
  }

  /**
   * Create a registration (public)
   */
  async createRegistration(
    token: string,
    createDto: CreateRegistrationDto,
  ): Promise<EventRegistration> {
    const event = await this.prisma.event.findUnique({
      where: { registrationToken: token },
    });

    if (!event) {
      throw new NotFoundException('Invalid registration token');
    }

    if (!event.registrationEnabled) {
      throw new ForbiddenException('Registration is currently closed');
    }

    // Validate times if participating
    if (createDto.participating) {
      if (!createDto.arrivalTime || !createDto.leaveTime) {
        throw new BadRequestException('Arrival and leave times are required when participating');
      }

      const arrival = new Date(createDto.arrivalTime);
      const leave = new Date(createDto.leaveTime);

      if (arrival >= leave) {
        throw new BadRequestException('Arrival time must be before leave time');
      }
    }

    return this.prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        rawName: createDto.rawName,
        participating: createDto.participating,
        arrivalTime: createDto.arrivalTime ? new Date(createDto.arrivalTime) : null,
        leaveTime: createDto.leaveTime ? new Date(createDto.leaveTime) : null,
        status: EventRegistrationStatus.PENDING,
      },
    });
  }

  /**
   * Get all registrations for an event (operator)
   */
  async getRegistrations(eventId: string): Promise<EventRegistration[]> {
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        matchedUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a registration (operator)
   */
  async updateRegistration(
    eventId: string,
    registrationId: string,
    updateDto: UpdateRegistrationDto,
  ): Promise<EventRegistration> {
    const registration = await this.prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID ${registrationId} not found for event ${eventId}`,
      );
    }

    const updateData: any = {};

    if (updateDto.matchedUserId !== undefined) {
      updateData.matchedUserId = updateDto.matchedUserId || null;
    }

    if (updateDto.arrivalTime !== undefined) {
      updateData.arrivalTime = updateDto.arrivalTime ? new Date(updateDto.arrivalTime) : null;
    }

    if (updateDto.leaveTime !== undefined) {
      updateData.leaveTime = updateDto.leaveTime ? new Date(updateDto.leaveTime) : null;
    }

    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        matchedUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Apply approved registrations to event (add users to EventUsers)
   */
  async applyRegistrations(eventId: string): Promise<{ applied: number }> {
    const approvedRegistrations = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: EventRegistrationStatus.APPROVED,
        matchedUserId: { not: null },
      },
    });

    let applied = 0;

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      for (const registration of approvedRegistrations) {
        if (!registration.matchedUserId) continue;

        // Check if user is already in event
        const existing = await tx.eventUsers.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: registration.matchedUserId,
            },
          },
        });

        if (!existing) {
          await tx.eventUsers.create({
            data: {
              eventId,
              userId: registration.matchedUserId,
            },
          });
          applied++;
        }
      }
    });

    return { applied };
  }

  /**
   * Export registrations to Excel
   */
  async exportRegistrationsToExcel(eventId: string): Promise<StreamableFile> {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Get all registrations with matched user info
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        matchedUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const renderer = new ExcelRenderer();

    // Helper to get user display name
    const getUserDisplayName = (user: {
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
    } | null): string => {
      if (!user) return '';
      if (user.name) return user.name;
      if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
      if (user.firstName) return user.firstName;
      if (user.lastName) return user.lastName;
      return user.username ?? '';
    };

    renderer.addTableSheet({
      name: 'Registrace',
      columns: [
        {
          header: 'Jméno',
          key: 'rawName',
          width: 25,
          value: (r) => r.rawName,
        },
        {
          header: 'Zúčastní se',
          key: 'participating',
          width: 15,
          value: (r) => (r.participating ? 'Ano' : 'Ne'),
        },
        {
          header: 'Příjezd',
          key: 'arrivalTime',
          width: 22,
          value: (r) => (r.arrivalTime ? new Date(r.arrivalTime).toISOString() : ''),
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'Odjezd',
          key: 'leaveTime',
          width: 22,
          value: (r) => (r.leaveTime ? new Date(r.leaveTime).toISOString() : ''),
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'Párovaný uživatel',
          key: 'matchedUser',
          width: 25,
          value: (r) => getUserDisplayName(r.matchedUser),
        },
        {
          header: 'Status',
          key: 'status',
          width: 15,
          value: (r) => r.status,
        },
      ],
      rows: registrations,
    });

    const safeFileName = renderer.safeFileName(`${event.name}_registrace`);
    return renderer.toStreamableFile(`${safeFileName}.xlsx`);
  }

  /**
   * Import registrations from Excel file
   */
  async importRegistrationsFromExcel(
    eventId: string,
    file: Express.Multer.File,
  ): Promise<{
    created: number;
    errors: Array<{ row: number; field: string; error: string }>;
  }> {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Validate file type
    if (
      !file.mimetype.includes('spreadsheet') &&
      !file.originalname.endsWith('.xlsx')
    ) {
      throw new BadRequestException('Soubor musí být ve formátu Excel (.xlsx)');
    }

    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    try {
      // ExcelJS accepts Buffer, ArrayBuffer, or Uint8Array
      // Express.Multer.File buffer is compatible but TypeScript needs assertion
      // @ts-expect-error - ExcelJS accepts Buffer-like types, but TypeScript is strict
      await workbook.xlsx.load(file.buffer);
      // Try to find sheet named "Registrace" or use first sheet
      worksheet =
        workbook.getWorksheet('Registrace') || workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('Excel soubor neobsahuje žádný list');
      }
    } catch (error) {
      throw new BadRequestException(
        'Nepodařilo se načíst Excel soubor. Zkontrolujte formát souboru.',
      );
    }

    // Read headers (first row)
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(cell.value?.toString().trim() || '');
    });

    // Map column indices by header name (case-insensitive)
    const columnMap: Record<string, number> = {};
    const headerMap: Record<string, string> = {
      jméno: 'rawName',
      'zúčastní se': 'participating',
      příjezd: 'arrivalTime',
      odjezd: 'leaveTime',
      'párovaný uživatel': 'matchedUser',
      status: 'status',
    };

    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim();
      if (headerMap[normalized]) {
        columnMap[headerMap[normalized]] = index + 1; // Excel is 1-indexed
      }
    });

    // Validate required columns
    if (!columnMap.rawName) {
      throw new BadRequestException(
        'Excel soubor musí obsahovat sloupec "Jméno"',
      );
    }
    if (!columnMap.participating) {
      throw new BadRequestException(
        'Excel soubor musí obsahovat sloupec "Zúčastní se"',
      );
    }

    const errors: Array<{ row: number; field: string; error: string }> = [];
    const registrationsToCreate: Array<{
      rawName: string;
      participating: boolean;
      arrivalTime: Date | null;
      leaveTime: Date | null;
      matchedUserId: string | null;
      status: EventRegistrationStatus;
    }> = [];

    // Process each data row (skip header row)
    for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const rowData: Record<string, any> = {};

      // Extract cell values
      Object.keys(columnMap).forEach((key) => {
        const colIndex = columnMap[key];
        const cell = row.getCell(colIndex);
        rowData[key] = cell.value?.toString().trim() || '';
      });

      // Skip empty rows
      if (!rowData.rawName) {
        continue;
      }

      // Validate rawName
      if (!rowData.rawName || rowData.rawName.length === 0) {
        errors.push({
          row: rowNum,
          field: 'Jméno',
          error: 'Jméno je povinné',
        });
        continue;
      }

      // Validate participating
      let participating: boolean;
      const participatingStr = rowData.participating?.toLowerCase().trim();
      if (participatingStr === 'ano' || participatingStr === 'yes' || participatingStr === 'true' || participatingStr === '1') {
        participating = true;
      } else if (participatingStr === 'ne' || participatingStr === 'no' || participatingStr === 'false' || participatingStr === '0') {
        participating = false;
      } else {
        errors.push({
          row: rowNum,
          field: 'Zúčastní se',
          error: 'Musí být "Ano" nebo "Ne"',
        });
        continue;
      }

      // Parse dates
      let arrivalTime: Date | null = null;
      let leaveTime: Date | null = null;

      if (rowData.arrivalTime) {
        const arrivalDate = new Date(rowData.arrivalTime);
        if (isNaN(arrivalDate.getTime())) {
          errors.push({
            row: rowNum,
            field: 'Příjezd',
            error: 'Neplatný formát data',
          });
          continue;
        }
        arrivalTime = arrivalDate;
      }

      if (rowData.leaveTime) {
        const leaveDate = new Date(rowData.leaveTime);
        if (isNaN(leaveDate.getTime())) {
          errors.push({
            row: rowNum,
            field: 'Odjezd',
            error: 'Neplatný formát data',
          });
          continue;
        }
        leaveTime = leaveDate;
      }

      // Validate times if participating
      if (participating && (!arrivalTime || !leaveTime)) {
        errors.push({
          row: rowNum,
          field: 'Čas',
          error: 'Příjezd a odjezd jsou povinné při účasti',
        });
        continue;
      }

      if (participating && arrivalTime && leaveTime && arrivalTime >= leaveTime) {
        errors.push({
          row: rowNum,
          field: 'Čas',
          error: 'Čas příjezdu musí být před časem odjezdu',
        });
        continue;
      }

      // Parse status
      let status: EventRegistrationStatus = EventRegistrationStatus.PENDING;
      if (rowData.status) {
        const statusUpper = rowData.status.toUpperCase().trim();
        if (
          statusUpper === 'PENDING' ||
          statusUpper === 'APPROVED' ||
          statusUpper === 'REJECTED'
        ) {
          status = statusUpper as EventRegistrationStatus;
        } else {
          errors.push({
            row: rowNum,
            field: 'Status',
            error: 'Musí být PENDING, APPROVED nebo REJECTED',
          });
          continue;
        }
      }

      // Lookup matchedUserId if provided
      let matchedUserId: string | null = null;
      if (rowData.matchedUser) {
        const matchedUserStr = rowData.matchedUser.trim();
        // Check if it's a UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(matchedUserStr)) {
          // Verify user exists
          const user = await this.prisma.user.findUnique({
            where: { id: matchedUserStr },
            select: { id: true },
          });
          if (user) {
            matchedUserId = user.id;
          } else {
            errors.push({
              row: rowNum,
              field: 'Párovaný uživatel',
              error: `Uživatel s ID ${matchedUserStr} nebyl nalezen`,
            });
            continue;
          }
        } else {
          // Try to find by username
          const user = await this.prisma.user.findUnique({
            where: { username: matchedUserStr },
            select: { id: true },
          });
          if (user) {
            matchedUserId = user.id;
          } else {
            errors.push({
              row: rowNum,
              field: 'Párovaný uživatel',
              error: `Uživatel s uživatelským jménem "${matchedUserStr}" nebyl nalezen`,
            });
            continue;
          }
        }
      }

      // All validations passed, add to create list
      registrationsToCreate.push({
        rawName: rowData.rawName,
        participating,
        arrivalTime,
        leaveTime,
        matchedUserId,
        status,
      });
    }

    // Create registrations in bulk
    let created = 0;
    if (registrationsToCreate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const regData of registrationsToCreate) {
          await tx.eventRegistration.create({
            data: {
              eventId,
              rawName: regData.rawName,
              participating: regData.participating,
              arrivalTime: regData.arrivalTime,
              leaveTime: regData.leaveTime,
              matchedUserId: regData.matchedUserId,
              status: regData.status,
            },
          });
          created++;
        }
      });
    }

    return { created, errors };
  }
}
