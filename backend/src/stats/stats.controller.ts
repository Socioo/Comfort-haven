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
        const users = await this.usersService.findAll();
        const properties = await this.propertiesService.findAll();
        const bookings = await this.bookingsService.findAll();

        const totalUsers = users.length;
        const totalHosts = users.filter(u => u.role === 'host').length;
        const totalProperties = properties.filter(p => p.status === 'active').length;
        const totalBookings = bookings.filter(b => b.status === 'confirmed').length;
        
        // Calculate revenue from confirmed bookings only
        const totalRevenue = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        return {
            totalUsers,
            totalHosts,
            totalProperties,
            totalBookings,
            totalRevenue
        };
    }
}
