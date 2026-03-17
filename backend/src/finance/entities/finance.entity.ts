import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('payouts')
export class Payout {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column()
    bookingId: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending',
    })
    status: string;

    @Column()
    method: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('refunds')
export class Refund {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column()
    bookingId: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column('text')
    reason: string;

    @Column({
        type: 'enum',
        enum: ['Pending', 'Approved', 'Processed', 'Rejected'],
        default: 'Pending',
    })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
