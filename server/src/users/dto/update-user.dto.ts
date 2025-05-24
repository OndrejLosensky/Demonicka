import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Uživatelské jméno může obsahovat pouze písmena, čísla, podtržítka a pomlčky',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Heslo musí obsahovat alespoň jedno velké písmeno, jedno malé písmeno, jedno číslo a jeden speciální znak',
    },
  )
  password?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Prosím zadejte platnou emailovou adresu' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Křestní jméno musí mít alespoň 2 znaky' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Příjmení musí mít alespoň 2 znaky' })
  lastName?: string;
}
