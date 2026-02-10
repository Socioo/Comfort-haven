import { Controller, Get } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PropertiesService } from '../properties/properties.service';
import { BookingsService } from '../bookings/bookings.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
    constructor(
        private readonly usersService: UsersService,
        private readonly propertiesService: PropertiesService,
        private readonly bookingsService: BookingsService,
    ) { }

    @Get()
    async getStats() {
        const totalUsers = (await this.usersService.findAll()).length;
        const totalProperties = (await this.propertiesService.findAll()).length;
        const totalBookings = (await this.bookingsService.findAll()).length;
        // Mock revenue for now as calculate it requires iteration
        const totalRevenue = (await this.bookingsService.findAll()).reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        return {
            totalUsers,
            totalProperties,
            totalBookings,
            totalRevenue
        };
    }
}
