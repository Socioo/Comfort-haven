import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [UsersModule, PropertiesModule, BookingsModule],
    controllers: [StatsController],
})
export class StatsModule { }
