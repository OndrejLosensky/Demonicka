import { IsNotEmpty, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CompleteRegistrationDto {
  @IsNotEmpty({ message: 'Registrační token je povinný' })
  registrationToken: string;

  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[\p{L}\p{M}0-9 _-]+$/u, {
    message:
      'Uživatelské jméno může obsahovat písmena (včetně diakritiky), čísla, mezery, podtržítka a pomlčky',
  })
  username: string;

  @IsNotEmpty({ message: 'Heslo je povinné' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string;
}
