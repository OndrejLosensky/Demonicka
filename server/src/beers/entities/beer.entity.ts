import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { Participant } from '../../participants/entities/participant.entity';

@Entity()
export class Beer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Participant, (participant) => participant.beers)
  participant: Participant;

  @Column()
  participantId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Optional: If you want to track which barrel this beer came from
  @Column({ nullable: true })
  barrelId?: string;
} 