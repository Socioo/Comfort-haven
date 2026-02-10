import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingService } from './seeding.service';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Property, Booking])],
    providers: [SeedingService],
    exports: [SeedingService],
})
export class SeedingModule { }
