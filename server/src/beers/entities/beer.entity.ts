import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { Participant } from '../../participants/entities/participant.entity';
import { Barrel } from '../../barrels/entities/barrel.entity';

@Entity()
export class Beer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Participant, (participant) => participant.beers, { onDelete: 'CASCADE' })
  participant: Participant;

  @Column()
  participantId: string;

  @ManyToOne(() => Barrel, { onDelete: 'CASCADE' })
  barrel: Barrel;

  @Column()
  barrelId: string;

  @CreateDateColumn()
  createdAt: Date;
} 