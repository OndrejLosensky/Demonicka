import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ProfilePictureService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  private readonly maxDimensions = { width: 2048, height: 2048 };
  private readonly outputDimensions = { width: 400, height: 400 };
  private readonly outputQuality = 85;

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Soubor je příliš velký. Maximální velikost je 5MB.');
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Neplatný formát souboru. Povolené formáty: JPEG, PNG, WebP, GIF.',
      );
    }
  }

  async processAndSaveImage(file: Express.Multer.File, userId: string): Promise<string> {
    this.validateFile(file);

    const outputFileName = `${userId}.webp`;
    const outputPath = path.join(this.uploadDir, outputFileName);

    try {
      // Process image with Sharp: resize, convert to WebP, optimize
      await sharp(file.buffer)
        .resize(this.outputDimensions.width, this.outputDimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: this.outputQuality })
        .toFile(outputPath);

      // Return relative URL path
      return `/api/uploads/profile-pictures/${outputFileName}`;
    } catch (error) {
      throw new BadRequestException('Chyba při zpracování obrázku. Zkuste to znovu.');
    }
  }

  async deleteImage(userId: string): Promise<void> {
    const fileName = `${userId}.webp`;
    const filePath = path.join(this.uploadDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  getImagePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }
}
