import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { DeviceType } from '../../auth/entities/device-token.entity';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  token: string;

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
} 