import { IsIn, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsIn(['light', 'dark'])
  preferredTheme?: 'light' | 'dark' | null;
}

