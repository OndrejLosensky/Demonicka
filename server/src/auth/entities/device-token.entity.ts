import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web'
}

@Entity('device_token')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({
    type: 'varchar',
    default: DeviceType.WEB
  })
  deviceType: DeviceType;

  @Column({ type: 'varchar', nullable: true })
  deviceName: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceModel: string | null;

  @Column({ type: 'varchar', nullable: true })
  osVersion: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastUsed: Date;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.deviceTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ default: false })
  isAdminDevice: boolean;

  @Column({ nullable: true })
  biometricEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 