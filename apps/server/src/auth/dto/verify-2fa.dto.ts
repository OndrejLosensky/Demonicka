import { IsString, Matches } from 'class-validator';

export class Verify2FADto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kód pro dvoufázové ověření musí být 6 číslic' })
  code: string;
}
