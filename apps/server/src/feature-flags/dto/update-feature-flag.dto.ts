import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFeatureFlagDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
