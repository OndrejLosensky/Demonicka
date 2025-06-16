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

  @Column({ nullable: true })
  deviceType: string | null;

  @Column({ nullable: true })
  deviceName: string | null;

  @Column({ nullable: true })
  deviceModel: string | null;

  @Column({ nullable: true })
  osVersion: string | null;

  @Column({ default: false })
  isAdminDevice: boolean;

  @Column({ default: false })
  isBiometricEnabled: boolean;

  @Column({ nullable: true })
  biometricType: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastUsed: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 