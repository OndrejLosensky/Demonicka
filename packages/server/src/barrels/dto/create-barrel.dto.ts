import { IsIn, IsNumber } from 'class-validator';

export class CreateBarrelDto {
  @IsIn([15, 30, 50], {
    message: 'Velikost sudu musí být 15L, 30L, nebo 50L',
  })
  size: number;

  @IsNumber()
  orderNumber: number;
}
