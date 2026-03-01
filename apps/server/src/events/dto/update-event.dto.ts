import { IsString, IsOptional, IsDateString, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  beerPongEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  beerSizesEnabled?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  beerPrice?: number;
}
