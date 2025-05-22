import { IsEnum } from 'class-validator';

export class CreateBarrelDto {
  @IsEnum([15, 30, 50], {
    message: 'Barrel size must be either 15L, 30L, or 50L',
  })
  size: 15 | 30 | 50;
}
