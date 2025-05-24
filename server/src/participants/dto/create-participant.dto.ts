import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateParticipantDto {
  @IsString({ message: 'Jméno musí být text' })
  @IsNotEmpty({ message: 'Jméno je povinné' })
  name: string;

  @IsEnum(['MALE', 'FEMALE'], { message: 'Pohlaví musí být MALE nebo FEMALE' })
  @IsNotEmpty({ message: 'Pohlaví je povinné' })
  gender: 'MALE' | 'FEMALE';
}
