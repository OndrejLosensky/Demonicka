import {
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDate,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[\p{L}\p{M}0-9_-]+$/u, {
    message:
      'Username can contain letters (incl. diacritics), numbers, underscores, and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'], {
    message: 'Gender must be either MALE or FEMALE',
  })
  gender?: 'MALE' | 'FEMALE';

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be one of: ADMIN, USER, PARTICIPANT',
  })
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isRegistrationComplete?: boolean;

  // Admin-specific fields
  @IsBoolean()
  @IsOptional()
  isTwoFactorEnabled?: boolean;

  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @IsBoolean()
  @IsOptional()
  isAdminLoginEnabled?: boolean;

  @IsArray()
  @IsOptional()
  allowedIPs?: string[];

  @IsDate()
  @IsOptional()
  lastAdminLogin?: Date;
}
