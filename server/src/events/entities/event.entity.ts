import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Participant } from '../../participants/entities/participant.entity';
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

    @Column({ default: true })
    isActive: boolean;

    @ManyToMany(() => Participant)
    @JoinTable({
        name: 'event_participants',
        joinColumn: { name: 'event_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'participant_id', referencedColumnName: 'id' }
    })
    participants: Participant[];

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
} 