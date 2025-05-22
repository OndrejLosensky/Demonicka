import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('barrels')
export class Barrel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'integer',
    enum: [15, 30, 50],
  })
  size: 15 | 30 | 50;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'integer' })
  orderNumber: number;

  @Column({ type: 'integer' })
  remainingBeers: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  setInitialBeers() {
    this.remainingBeers = this.size * 2;
  }
}
