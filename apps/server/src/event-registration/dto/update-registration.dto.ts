import { IsOptional, IsString, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { EventRegistrationStatus } from '@prisma/client';

export class UpdateRegistrationDto {
  @IsOptional()
  @IsUUID()
  matchedUserId?: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsDateString()
  leaveTime?: string;

  @IsOptional()
  @IsEnum(EventRegistrationStatus)
  status?: EventRegistrationStatus;
}
