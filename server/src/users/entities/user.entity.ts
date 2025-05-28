import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty, MinLength, Matches, IsEnum } from 'class-validator';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Beer } from '../../beers/entities/beer.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Uživatelské jméno může obsahovat pouze písmena, čísla, podtržítka a pomlčky',
  })
  username: string;

  @Column({ nullable: true, type: 'varchar' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string | null;

  @Column({ type: 'varchar' })
  @IsNotEmpty({ message: 'Jméno je povinné' })
  name: string;

  @Column({ type: 'varchar' })
  @IsEnum(['MALE', 'FEMALE'], {
    message: 'Pohlaví musí být buď MALE nebo FEMALE',
  })
  gender: 'MALE' | 'FEMALE';

  @Column({ default: 0 })
  beerCount: number;

  @Column({ type: 'datetime', nullable: true })
  lastBeerTime: Date | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  registrationToken: string | null;

  @Column({ type: 'boolean', default: false })
  isRegistrationComplete: boolean;

  @OneToMany(() => Beer, (beer) => beer.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  beers: Beer[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deletedAt: Date | null;
}
