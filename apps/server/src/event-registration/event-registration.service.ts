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
  async getEventByToken(token: string): Promise<{ eventName: string; registrationEnabled: boolean }> {
    const event = await this.prisma.event.findUnique({
      where: { registrationToken: token },
      select: { name: true, registrationEnabled: true },
    });

    if (!event) {
      throw new NotFoundException('Invalid registration token');
    }

    if (!event.registrationEnabled) {
      throw new ForbiddenException('Registration is currently closed');
    }

    return {
      eventName: event.name,
      registrationEnabled: event.registrationEnabled,
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
}
