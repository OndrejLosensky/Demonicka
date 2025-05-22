import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
  DeleteDateColumn,
} from 'typeorm';
import { Participant } from '../../participants/entities/participant.entity';
import { Barrel } from '../../barrels/entities/barrel.entity';

@Entity()
export class Beer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Participant, (participant) => participant.beers, {
    onDelete: 'CASCADE',
  })
  participant: Participant;

  @Column()
  participantId: string;

  @ManyToOne(() => Barrel, { onDelete: 'CASCADE', nullable: true })
  barrel: Barrel | null;

  @Column({ nullable: true })
  barrelId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
} 