import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { DeviceType } from '../entities/device-token.entity';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @IsEnum(DeviceType)
  @IsNotEmpty()
  deviceType: DeviceType;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsString()
  @IsOptional()
  twoFactorCode?: string;
} 