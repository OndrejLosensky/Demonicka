import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Uživatelské jméno může obsahovat pouze písmena, čísla, podtržítka a pomlčky',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Heslo musí obsahovat alespoň 1 velké písmeno, 1 malé písmeno a 1 číslo nebo speciální znak',
  })
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;
}
