import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Barrel } from '../../barrels/entities/barrel.entity';

@Entity()
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'datetime' })
    startDate: Date;

    @Column({ type: 'datetime', nullable: true })
    endDate: Date | null;

    @Column({ default: false })
    isActive: boolean;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'event_users',
        joinColumn: { name: 'event_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
    })
    users: User[];

    @ManyToMany(() => Barrel)
    @JoinTable({
        name: 'event_barrels',
        joinColumn: { name: 'event_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'barrel_id', referencedColumnName: 'id' }
    })
    barrels: Barrel[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
} 