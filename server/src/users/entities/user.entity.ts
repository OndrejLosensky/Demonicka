import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { IsNotEmpty, MinLength, Matches, IsEnum } from 'class-validator';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { DeviceToken } from '../../auth/entities/device-token.entity';
import { Beer } from '../../beers/entities/beer.entity';
import { UserRole } from '../enums/user-role.enum';
import { Event } from '../../events/entities/event.entity';
import { EventBeer } from '../../events/entities/event-beer.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Uživatelské jméno může obsahovat pouze písmena, čísla, podtržítka a pomlčky',
  })
  username: string;

  @Column({ nullable: true, type: 'varchar' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  @IsNotEmpty({ message: 'Jméno je povinné' })
  name: string | null;

  // Future columns (nullable for backward compatibility)
  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar' })
  @IsEnum(['MALE', 'FEMALE'], {
    message: 'Pohlaví musí být buď MALE nebo FEMALE',
  })
  gender: 'MALE' | 'FEMALE';

  @Column({ type: 'varchar', enum: UserRole, default: UserRole.PARTICIPANT })
  @IsEnum(UserRole, {
    message: 'Role musí být jedna z: ADMIN, USER, PARTICIPANT',
  })
  role: UserRole;

  @Column({ default: 0 })
  beerCount: number;

  @Column({ type: 'datetime', nullable: true })
  lastBeerTime: Date | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  registrationToken: string | null;

  @Column({ type: 'boolean', default: false })
  isRegistrationComplete: boolean;

  // Admin-specific fields
  @Column({ type: 'boolean', default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret: string | null;

  @Column({ type: 'boolean', default: false })
  isAdminLoginEnabled: boolean;

  @Column({ type: 'simple-array', nullable: true })
  allowedIPs: string[] | null;

  @Column({ type: 'datetime', nullable: true })
  lastAdminLogin: Date | null;

  // Relations
  @OneToMany(() => Beer, (beer) => beer.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  beers: Beer[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => DeviceToken, (token) => token.user)
  deviceTokens: DeviceToken[];

  @ManyToMany(() => Event, (event) => event.users)
  events: Event[];

  @OneToMany(() => EventBeer, (eventBeer) => eventBeer.user)
  eventBeers: EventBeer[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deletedAt: Date | null;
}
