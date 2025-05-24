import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class UpdateParticipantDto {
  @IsOptional()
  @IsString({ message: 'Jméno musí být text' })
  name?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'], { message: 'Pohlaví musí být MALE nebo FEMALE' })
  gender?: 'MALE' | 'FEMALE';

  @IsOptional()
  lastBeerTime?: Date;

  @IsOptional()
  @IsNumber({}, { message: 'Počet piv musí být číslo' })
  beerCount?: number;
}
