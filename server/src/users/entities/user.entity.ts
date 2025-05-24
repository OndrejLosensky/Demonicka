import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'Uživatelské jméno je povinné' })
  @MinLength(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, and hyphens',
  })
  username: string;

  @Column()
  @IsNotEmpty({ message: 'Heslo je povinné' })
  @MinLength(8, { message: 'Heslo musí mít alespoň 8 znaků' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Prosím zadejte platnou emailovou adresu' })
  @IsNotEmpty({ message: 'Email je povinný' })
  email: string;

  @Column()
  @MinLength(2, { message: 'Křestní jméno musí mít alespoň 2 znaky' })
  firstName: string;

  @Column()
  @MinLength(2, { message: 'Příjmení musí mít alespoň 2 znaky' })
  lastName: string;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
