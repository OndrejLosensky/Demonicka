import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = 'uploads/profile-pictures';

  generateUniqueFileName(originalName: string): string {
    const fileExt = extname(originalName);
    const uniqueId = uuidv4();
    return `${uniqueId}${fileExt}`;
  }

  getUploadPath(): string {
    return this.uploadPath;
  }

  getFullPath(filename: string): string {
    return `${this.uploadPath}/${filename}`;
  }
}
