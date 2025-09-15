import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from './event.entity';
import { Barrel } from '../../barrels/entities/barrel.entity';

@Entity('event_beers')
export class EventBeer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.eventBeers, {
    onDelete: 'CASCADE',
  })
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User, (user) => user.eventBeers, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Barrel, { onDelete: 'CASCADE', nullable: true })
  barrel: Barrel | null;

  @Column({ nullable: true })
  barrelId: string | null;

  @CreateDateColumn()
  consumedAt: Date;

  @Column({ default: false })
  spilled: boolean;

  @DeleteDateColumn()
  deletedAt: Date;
} 