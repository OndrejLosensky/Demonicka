import { IsOptional, IsBoolean, IsNumber, Min, IsIn } from 'class-validator';

export class UpdateBarrelDto {
  @IsOptional()
  @IsIn([15, 30, 50], {
    message: 'Velikost sudu musí být 15L, 30L, nebo 50L',
  })
  size?: number;

  @IsOptional()
  @IsBoolean({ message: 'Aktivní stav musí být boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Počet zbývajících piv musí být číslo' })
  @Min(0, { message: 'Počet zbývajících piv nemůže být záporný' })
  remainingBeers?: number;
}
