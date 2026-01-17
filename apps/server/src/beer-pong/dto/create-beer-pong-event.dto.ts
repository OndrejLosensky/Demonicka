import { IsString, IsOptional, IsUUID, IsInt, IsEnum, Min } from 'class-validator';
import { CancellationPolicy } from '@prisma/client';

export class CreateBeerPongEventDto {
  @IsUUID()
  eventId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  beersPerPlayer?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  timeWindowMinutes?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  undoWindowMinutes?: number;

  @IsEnum(CancellationPolicy)
  @IsOptional()
  cancellationPolicy?: CancellationPolicy;
}
