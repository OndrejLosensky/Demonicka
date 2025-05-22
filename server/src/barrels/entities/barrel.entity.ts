import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
