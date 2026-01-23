import { IsOptional, IsEnum, IsNumber, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventBeerDto {
  @IsOptional()
  @IsUUID()
  barrelId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  spilled?: boolean;

  @IsOptional()
  @IsEnum(['SMALL', 'LARGE'])
  beerSize?: 'SMALL' | 'LARGE';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.1)
  @Max(1.0)
  volumeLitres?: number;
}
