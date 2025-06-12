import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Barrel } from '../../barrels/entities/barrel.entity';
import { EventBeer } from './event-beer.entity';

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

    @ManyToMany(() => User, (user) => user.events)
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

    @OneToMany(() => EventBeer, (eventBeer) => eventBeer.event)
    eventBeers: EventBeer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
} 