import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Notification preferences
  @Column({ type: 'boolean', default: true })
  pushNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  eventNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  achievementNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  friendActivityNotificationsEnabled: boolean;

  // App preferences
  @Column({ type: 'varchar', default: 'system' })
  theme: string;

  @Column({ type: 'varchar', default: 'en' })
  language: string;

  @Column({ type: 'boolean', default: true })
  hapticFeedbackEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  soundEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 