import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { STORAGE_SERVICE, type IStorageService } from '../storage/storage.interface';

import { UserRole } from '@prisma/client';

const GALLERY_PREFIX = 'demonicka/gallery/';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async listByEvent(eventId: string) {
    const photos = await this.prisma.galleryPhoto.findMany({
      where: { eventId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
    });
    return photos.map((p) => ({
      id: p.id,
      eventId: p.eventId,
      userId: p.userId,
      caption: p.caption,
      order: p.order,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    }));
  }

  async create(
    eventId: string,
    userId: string,
    buffer: Buffer,
    contentType: string,
    caption?: string,
    role?: UserRole,
  ) {
    const isStaff = role === UserRole.SUPER_ADMIN || role === UserRole.OPERATOR;
    if (!isStaff) {
      const participant = await this.prisma.eventUsers.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (!participant) {
        throw new ForbiddenException('Nejste účastníkem této události');
      }
    }

    const photo = await this.prisma.galleryPhoto.create({
      data: {
        eventId,
        userId,
        s3Key: '',
        caption: caption ?? null,
      },
    });

    const key = `${GALLERY_PREFIX}${eventId}/${photo.id}.webp`;
    await this.storage.upload(buffer, key, contentType);

    await this.prisma.galleryPhoto.update({
      where: { id: photo.id },
      data: { s3Key: key },
    });

    const created = await this.prisma.galleryPhoto.findUniqueOrThrow({
      where: { id: photo.id },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
    });
    return {
      id: created.id,
      eventId: created.eventId,
      userId: created.userId,
      s3Key: created.s3Key,
      caption: created.caption,
      order: created.order,
      createdAt: created.createdAt.toISOString(),
      user: created.user,
    };
  }

  async getPhotoById(photoId: string) {
    const photo = await this.prisma.galleryPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo) {
      throw new NotFoundException('Foto nenalezeno');
    }
    return photo;
  }

  /** Delete a photo. Allowed if current user is the owner or SUPER_ADMIN. Removes from S3 and DB. */
  async deletePhoto(photoId: string, userId: string, role: UserRole) {
    const photo = await this.getPhotoById(photoId);
    const canDelete = photo.userId === userId || role === UserRole.SUPER_ADMIN;
    if (!canDelete) {
      throw new ForbiddenException('Můžete mazat pouze vlastní fotky');
    }
    try {
      await this.storage.delete(photo.s3Key);
    } catch {
      // ignore S3 errors (e.g. already deleted)
    }
    await this.prisma.galleryPhoto.delete({ where: { id: photoId } });
  }

  /** List gallery photos: for OPERATOR/SUPER_ADMIN from all events; for USER/PARTICIPANT only from events they are in. */
  async listForCurrentUser(userId: string, role: UserRole, eventId?: string) {
    let eventIds: string[];

    if (role === UserRole.SUPER_ADMIN || role === UserRole.OPERATOR) {
      eventIds = await this.prisma.event
        .findMany({ select: { id: true } })
        .then((rows) => rows.map((r) => r.id));
    } else {
      eventIds = await this.prisma.eventUsers
        .findMany({
          where: { userId },
          select: { eventId: true },
        })
        .then((rows) => rows.map((r) => r.eventId));
    }

    if (eventIds.length === 0) return [];

    const where =
      eventId && eventIds.includes(eventId)
        ? { eventId }
        : eventId
          ? { eventId: { in: [] as string[] } }
          : { eventId: { in: eventIds } };

    const photos = await this.prisma.galleryPhoto.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        user: { select: { id: true, username: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });

    return photos.map((p) => ({
      id: p.id,
      eventId: p.eventId,
      eventName: p.event.name,
      userId: p.userId,
      caption: p.caption,
      order: p.order,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    }));
  }
}
