import { IsIn, IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsIn(['light', 'dark'])
  preferredTheme?: 'light' | 'dark' | null;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;
}

