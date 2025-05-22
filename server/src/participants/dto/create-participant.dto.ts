import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['MALE', 'FEMALE'])
  @IsNotEmpty()
  gender: 'MALE' | 'FEMALE';
}
