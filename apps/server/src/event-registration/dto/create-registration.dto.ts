import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  rawName: string;

  @IsBoolean()
  participating: boolean;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsDateString()
  leaveTime?: string;
}
