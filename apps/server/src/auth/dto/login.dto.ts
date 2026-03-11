import { IsNotEmpty, IsString, MinLength, Matches, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[\p{L}\p{M}0-9 _-]+$/u, {
    message:
      'Uživatelské jméno může obsahovat písmena (včetně diakritiky), čísla, mezery, podtržítka a pomlčky',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Heslo je povinné' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    if (value === undefined || value === null || value === '') return undefined;
    return value;
  })
  @IsBoolean()
  rememberMe?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kód pro dvoufázové ověření musí být 6 číslic' })
  twoFactorCode?: string;
}
