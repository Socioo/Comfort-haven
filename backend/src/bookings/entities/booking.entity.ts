import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Property, (property) => property.bookings)
    @JoinColumn({ name: 'propertyId' })
    property: Property;

    @Column()
    propertyId: string;

    @ManyToOne(() => User, (user) => user.bookings)
    @JoinColumn({ name: 'guestId' })
    guest: User;

    @Column()
    guestId: string;

    @Column()
    startDate: Date;

    @Column()
    endDate: Date;

    @Column('decimal', { precision: 10, scale: 2 })
    totalPrice: number;

    @Column({ default: 'pending' })
    status: string; // 'pending', 'confirmed', 'cancelled', 'completed'

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
