import { IsNotEmpty, IsEnum } from 'class-validator';

export class CreateParticipantDto {
  @IsNotEmpty({ message: 'Jméno je povinné' })
  username: string;

  @IsEnum(['MALE', 'FEMALE'], {
    message: 'Pohlaví musí být buď MALE nebo FEMALE',
  })
  gender: 'MALE' | 'FEMALE';
}
