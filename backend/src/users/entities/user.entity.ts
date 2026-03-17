import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../../common/constants';
import { Property } from '../../properties/entities/property.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ select: false }) // Password won't be selected by default
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true, select: false })
  hashedRefreshToken: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  mustChangePassword: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 'active' })
  status: string; // 'active', 'suspended', 'banned'

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {
      newUsers: true,
      newProperties: true,
      newBookings: false,
      marketing: false,
    },
  })
  notifications: {
    newUsers: boolean;
    newProperties: boolean;
    newBookings: boolean;
    marketing: boolean;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {
      theme: 'light',
      language: 'en',
    },
  })
  appearance: {
    theme: string;
    language: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Properties owned by the user
  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];

  // Bookings made by the user
  @OneToMany(() => Booking, (booking) => booking.guest)
  bookings: Booking[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  // Helper method to exclude sensitive data
  toJSON() {
    const { password, ...user } = this;
    return user;
  }
}




















// // src/users/entities/user.entity.ts
// import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
// import { Exclude } from 'class-transformer';

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ unique: true })
//   email: string;

//   @Column({ nullable: true })
//   phone: string;

//   @Column()
//   @Exclude()
//   password: string;

//   @Column({ nullable: true })
//   firstName: string;

//   @Column({ nullable: true })
//   lastName: string;

//   @Column({ default: false })
//   isEmailVerified: boolean;

//   @Column({ default: true })
//   isActive: boolean;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;

//   // Add profile image, etc. as needed
// }