import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import { STORAGE_SERVICE, type IStorageService } from '../storage/storage.interface';

const PROFILE_PICTURES_PREFIX = 'demonicka/profile-pictures/';

@Injectable()
export class ProfilePictureService {
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly outputDimensions = { width: 400, height: 400 };
  private readonly outputQuality = 85;

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        'Soubor je příliš velký. Maximální velikost je 5MB.',
      );
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Neplatný formát souboru. Povolené formáty: JPEG, PNG, WebP, GIF.',
      );
    }
  }

  async processAndSaveImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    this.validateFile(file);

    const key = `${PROFILE_PICTURES_PREFIX}${userId}.webp`;

    try {
      const webpBuffer = await sharp(file.buffer)
        .resize(this.outputDimensions.width, this.outputDimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: this.outputQuality })
        .toBuffer();

      return this.storage.upload(webpBuffer, key, 'image/webp');
    } catch {
      throw new BadRequestException(
        'Chyba při zpracování obrázku. Zkuste to znovu.',
      );
    }
  }

  async deleteImage(userId: string): Promise<void> {
    const key = `${PROFILE_PICTURES_PREFIX}${userId}.webp`;
    await this.storage.delete(key);
  }
}
