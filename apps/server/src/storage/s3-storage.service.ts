import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageService } from './storage.interface';

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    if (!region || !bucket) {
      this.logger.warn(
        'AWS_REGION or AWS_S3_BUCKET not set. S3 storage will not work.',
      );
    }
    this.bucket = bucket ?? '';
    this.s3 = new S3Client({
      region: region ?? 'eu-central-1',
      credentials:
        this.configService.get<string>('AWS_ACCESS_KEY_ID') &&
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY')
          ? {
              accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
              secretAccessKey: this.configService.get<string>(
                'AWS_SECRET_ACCESS_KEY',
              )!,
            }
          : undefined,
    });
  }

  async upload(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return key;
  }

  async delete(key: string): Promise<void> {
    if (!this.bucket) {
      return;
    }
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      this.logger.warn(`S3 delete failed for key ${key}:`, err);
    }
  }

  async getPresignedUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async getObjectStream(
    key: string,
  ): Promise<{ stream: NodeJS.ReadableStream; contentType?: string }> {
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    if (!response.Body) {
      throw new Error('S3 GetObject returned no body');
    }
    return {
      stream: response.Body as NodeJS.ReadableStream,
      contentType: response.ContentType ?? undefined,
    };
  }

  async listObjects(
    prefix: string,
  ): Promise<Array<{ key: string; lastModified: Date; size?: number }>> {
    if (!this.bucket) {
      return [];
    }
    const result: Array<{ key: string; lastModified: Date; size?: number }> = [];
    let continuationToken: string | undefined;
    do {
      const response = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      const contents = response.Contents ?? [];
      for (const obj of contents) {
        if (obj.Key != null) {
          result.push({
            key: obj.Key,
            lastModified: obj.LastModified ?? new Date(0),
            size: obj.Size,
          });
        }
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
    return result;
  }
}
