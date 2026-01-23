import {
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDate,
  IsEmail,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[\p{L}\p{M}0-9 _-]+$/u, {
    message:
      'Username can contain letters (incl. diacritics), numbers, spaces, underscores, and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

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
    message: 'Role must be one of: SUPER_ADMIN, OPERATOR, USER, PARTICIPANT',
  })
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isRegistrationComplete?: boolean;

  // Operator/Admin-specific fields
  @IsBoolean()
  @IsOptional()
  isTwoFactorEnabled?: boolean;

  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @IsBoolean()
  @IsOptional()
  canLogin?: boolean;

  @IsArray()
  @IsOptional()
  allowedIPs?: string[];

  @IsDate()
  @IsOptional()
  lastAdminLogin?: Date;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsOptional()
  googleProfilePictureUrl?: string | null;

  @IsString()
  @IsOptional()
  googleId?: string | null;
}
