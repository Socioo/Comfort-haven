import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingService } from './seeding.service';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Faq } from '../faqs/entities/faq.entity';
import { Payout, Refund } from '../finance/entities/finance.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Property, Booking, Favorite, Faq, Payout, Refund])],
    providers: [SeedingService],
    exports: [SeedingService],
})
export class SeedingModule { }
