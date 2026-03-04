import { IsIn, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;
const APPS = ['web', 'mobile'] as const;

export class IngestLogDto {
  @IsIn(APPS)
  app!: 'web' | 'mobile';

  @IsIn(LEVELS)
  level!: (typeof LEVELS)[number];

  @IsString()
  @MaxLength(10000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  event?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  actorUserId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
