import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[\p{L}\p{M}0-9_-]+$/u, {
    message: 'Uživatelské jméno může obsahovat písmena (včetně diakritiky), čísla, podtržítka a pomlčky',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Heslo je povinné' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string;
}
