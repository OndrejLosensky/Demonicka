import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  DeleteDateColumn,
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

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'integer' })
  orderNumber: number;

  @Column({ type: 'integer' })
  remainingBeers: number;

  @Column({ type: 'integer' })
  totalBeers: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @BeforeInsert()
  setInitialBeers() {
    this.totalBeers = this.size * 2;
    this.remainingBeers = this.totalBeers;
  }
}
