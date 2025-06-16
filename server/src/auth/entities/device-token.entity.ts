import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web'
}

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  token: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  deviceType: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceName: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceModel: string | null;

  @Column({ type: 'varchar', nullable: true })
  osVersion: string | null;

  @Column({ type: 'boolean', default: false })
  isAdminDevice: boolean;

  @Column({ type: 'boolean', default: false })
  isBiometricEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  biometricType: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastUsed: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 