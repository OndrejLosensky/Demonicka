import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['MALE', 'FEMALE'])
  gender: 'MALE' | 'FEMALE';
}
