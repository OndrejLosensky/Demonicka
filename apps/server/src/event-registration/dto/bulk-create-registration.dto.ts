import { IsString, IsBoolean, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { EventRegistrationStatus } from '@prisma/client';

export class BulkCreateRegistrationDto {
  @IsString()
  rawName: string;

  @IsBoolean()
  participating: boolean;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsDateString()
  leaveTime?: string;

  @IsOptional()
  @IsString()
  matchedUserId?: string; // Can be username or UUID

  @IsOptional()
  @IsEnum(EventRegistrationStatus)
  status?: EventRegistrationStatus;
}
