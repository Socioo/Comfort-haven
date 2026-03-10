import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../../reviews/entities/review.entity';

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

    @Column({ nullable: true })
    address: string;

    @Column({ default: 'pending' })
    status: string; // 'active', 'pending', 'suspended', 'rejected'

    @Column('float', { default: 0 })
    rating: number;

    @Column('int', { default: 0 })
    reviewCount: number;

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column('simple-array', { nullable: true })
    amenities: string[];

    @Column({ nullable: true })
    lga: string; // Local Government Area

    @Column('int', { nullable: true, default: 1 })
    bedrooms: number;

    @Column('int', { nullable: true, default: 1 })
    bathrooms: number;

    @Column('int', { nullable: true, default: 2 })
    guests: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column('simple-array', { nullable: true })
    availableDates: string[];

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

    @OneToMany(() => Review, (review) => review.property)
    reviews: Review[];
}
