import { IsOptional, IsBoolean, IsString, IsIn } from 'class-validator';

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  eventNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  achievementNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  friendActivityNotificationsEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['system', 'light', 'dark'])
  theme?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'cs'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  hapticFeedbackEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;
} 