import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class UpdateParticipantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';

  @IsOptional()
  lastBeerTime?: Date;

  @IsOptional()
  @IsNumber()
  beerCount?: number;
}
