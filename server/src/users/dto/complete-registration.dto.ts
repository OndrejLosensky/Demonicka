import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CompleteRegistrationDto {
  @IsNotEmpty({ message: 'Registrační token je povinný' })
  registrationToken: string;

  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[\p{L}\p{M}0-9_-]+$/u, {
    message:
      'Uživatelské jméno může obsahovat písmena (včetně diakritiky), čísla, podtržítka a pomlčky',
  })
  username: string;

  @IsNotEmpty({ message: 'Heslo je povinné' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string;
}