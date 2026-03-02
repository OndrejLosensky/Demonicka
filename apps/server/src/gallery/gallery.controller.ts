import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as sharp from 'sharp';
import { GalleryService } from './gallery.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { STORAGE_SERVICE, type IStorageService } from '../storage/storage.interface';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for gallery
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 85;

@Controller('gallery')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  @Get('events/:eventId/photos')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER, UserRole.PARTICIPANT)
  listPhotos(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.galleryService.listByEvent(eventId);
  }

  @Get('photos')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER, UserRole.PARTICIPANT)
  listMyPhotos(@GetUser() user: User, @Query('eventId') eventId?: string) {
    return this.galleryService.listForCurrentUser(
      user.id,
      user.role,
      eventId ?? undefined,
    );
  }

  @Post('events/:eventId/photos')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER, UserRole.PARTICIPANT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nebyl poskytnut žádný soubor');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Soubor je příliš velký. Maximálně 10MB.');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Povolené formáty: JPEG, PNG, WebP, GIF.');
    }

    let buffer: Buffer;
    try {
      buffer = await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch {
      throw new BadRequestException('Chyba při zpracování obrázku.');
    }

    return this.galleryService.create(
      eventId,
      user.id,
      buffer,
      'image/webp',
      typeof caption === 'string' ? caption : undefined,
      user.role,
    );
  }

  @Get('photos/:photoId/image')
  @Public()
  async getPhotoImage(
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Res() res: Response,
  ) {
    const photo = await this.galleryService.getPhotoById(photoId);
    try {
      const { stream, contentType } = await this.storage.getObjectStream(photo.s3Key);
      res.setHeader('Content-Type', contentType ?? 'image/webp');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return stream.pipe(res);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
      if (code === 'NoSuchKey') {
        throw new BadRequestException('Foto nenalezeno');
      }
      throw err;
    }
  }

  @Delete('photos/:photoId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER, UserRole.PARTICIPANT)
  deletePhoto(@Param('photoId', ParseUUIDPipe) photoId: string, @GetUser() user: User) {
    return this.galleryService.deletePhoto(photoId, user.id, user.role);
  }
}
