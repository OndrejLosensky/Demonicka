import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[\p{L}\p{M}0-9_-]+$/u, {
    message:
      'Uživatelské jméno může obsahovat písmena (včetně diakritiky), čísla, podtržítka a pomlčky',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Heslo je povinné' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Jméno musí mít alespoň 2 znaky' })
  name?: string;

  // Future fields (optional)
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Křestní jméno musí mít alespoň 2 znaky' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Příjmení musí mít alespoň 2 znaky' })
  lastName?: string;

  @IsEnum(['MALE', 'FEMALE'], {
    message: 'Pohlaví musí být buď MALE nebo FEMALE',
  })
  @IsNotEmpty({ message: 'Pohlaví je povinné' })
  gender: 'MALE' | 'FEMALE';
}
