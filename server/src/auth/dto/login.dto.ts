import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Uživatelské jméno nebo email musí být text' })
  usernameOrEmail: string;

  @IsString({ message: 'Heslo musí být text' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string;
}
