import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

export enum AchievementType {
  EVENT_WIN = 'EVENT_WIN',
  BEERS_IN_EVENT = 'BEERS_IN_EVENT',
  BEERS_IN_HOUR = 'BEERS_IN_HOUR',
  EVENTS_PARTICIPATED = 'EVENTS_PARTICIPATED',
  TOTAL_BEERS = 'TOTAL_BEERS',
  CONSECUTIVE_DAYS = 'CONSECUTIVE_DAYS',
  FIRST_BEER = 'FIRST_BEER',
  MILESTONE = 'MILESTONE',
}

export enum AchievementCategory {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
  LEGENDARY = 'LEGENDARY',
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    enum: AchievementType,
  })
  type: AchievementType;

  @Column({
    type: 'varchar',
    enum: AchievementCategory,
    default: AchievementCategory.BEGINNER,
  })
  category: AchievementCategory;

  @Column({ type: 'int' })
  targetValue: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'varchar', nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isRepeatable: boolean;

  @Column({ type: 'int', default: 1 })
  maxCompletions: number;

  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.achievement)
  userAchievements: UserAchievement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
} 