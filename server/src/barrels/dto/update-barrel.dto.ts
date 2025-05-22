import { IsEnum, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateBarrelDto {
  @IsOptional()
  @IsEnum([15, 30, 50], {
    message: 'Barrel size must be either 15L, 30L, or 50L',
  })
  size?: 15 | 30 | 50;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingBeers?: number;
}
