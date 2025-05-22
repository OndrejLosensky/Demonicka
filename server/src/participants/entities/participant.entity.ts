import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Beer } from '../../beers/entities/beer.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  gender: 'MALE' | 'FEMALE';

  @Column({ default: 0 })
  beerCount: number;

  @Column({ nullable: true, type: 'datetime' })
  lastBeerTime: Date | null;

  @OneToMany(() => Beer, (beer) => beer.participant, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  beers: Beer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
