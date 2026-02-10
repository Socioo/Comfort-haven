import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('properties')
export class Property {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column()
    location: string;

    @Column({ default: 'pending' })
    status: string; // 'active', 'pending', 'suspended', 'rejected'

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column('simple-array', { nullable: true })
    amenities: string[];

    @ManyToOne(() => User, (user) => user.properties)
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column()
    ownerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Booking, (booking) => booking.property)
    bookings: Booking[];
}
