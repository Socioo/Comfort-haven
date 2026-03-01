import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingService } from './seeding.service';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Favorite } from '../favorites/entities/favorite.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Property, Booking, Favorite])],
    providers: [SeedingService],
    exports: [SeedingService],
})
export class SeedingModule { }
