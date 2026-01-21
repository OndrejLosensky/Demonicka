import { IsNotEmpty, IsEnum, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty({ message: 'Jméno je povinné' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[\p{L}\p{M}0-9 _-]+$/u, {
    message:
      'Jméno může obsahovat písmena (včetně diakritiky), čísla, mezery, podtržítka a pomlčky',
  })
  username: string;

  @IsEnum(['MALE', 'FEMALE'], {
    message: 'Pohlaví musí být buď MALE nebo FEMALE',
  })
  gender: 'MALE' | 'FEMALE';
}
