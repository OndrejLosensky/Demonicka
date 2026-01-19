import { IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { CancellationPolicy } from '@prisma/client';

export class UpdateBeerPongDefaultsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  beersPerPlayer?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeWindowMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  undoWindowMinutes?: number;

  @IsOptional()
  @IsEnum(CancellationPolicy)
  cancellationPolicy?: CancellationPolicy;
}

