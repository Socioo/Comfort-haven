import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PropertiesService } from '../properties/properties.service';
import { BookingsService } from '../bookings/bookings.service';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/constants';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
    constructor(
        private readonly usersService: UsersService,
        private readonly propertiesService: PropertiesService,
        private readonly bookingsService: BookingsService,
    ) { }

    @Get()
    async getStats(
        @Query('period') period: string = '7d',
        @Query('revenueStart') revenueStart?: string,
        @Query('revenueEnd') revenueEnd?: string
    ) {
        let days = 7;
        if (period.endsWith('d')) {
            days = parseInt(period) || 7;
        } else if (period === '1m') days = 30;
        else if (period === '3m') days = 90;
        else if (period === '6m') days = 180;
        else if (period === '9m') days = 270;
        else if (period === '1y') days = 365;
        else days = parseInt(period) || 7;

        const users = await this.usersService.findAll();
        const properties = await this.propertiesService.findAll();
        const bookings = await this.bookingsService.findAll();

        const totalGuests = users.filter(u => u.role === UserRole.USER).length;
        const totalHosts = users.filter(u => u.role === UserRole.HOST).length;
        const activeGuests = users.filter(u => u.role === UserRole.USER && u.status === 'active').length;
        const activeHosts = users.filter(u => u.role === UserRole.HOST && u.status === 'active').length;
        const totalProperties = properties.length;
        const activeProperties = properties.filter(p => p.status === 'active').length;
        
        // Calculate revenue
        let filteredBookings = bookings.filter(b => 
            ['confirmed', 'completed'].includes(b.status?.toLowerCase())
        );
        
        if (revenueStart || revenueEnd) {
            const start = revenueStart ? new Date(revenueStart) : new Date(0);
            const end = revenueEnd ? new Date(revenueEnd) : new Date();
            // Set end to end of day
            end.setHours(23, 59, 59, 999);
            
            filteredBookings = filteredBookings.filter(b => {
                const bDate = new Date(b.createdAt);
                return bDate >= start && bDate <= end;
            });
        }

        const totalRevenue = filteredBookings
            .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        // Time-series data
        const activityData = this.generateTimeSeriesData(users, properties, days);

        // Recent Activities
        const recentHosts = users
            .filter(u => u.role === UserRole.HOST && !u.isVerified)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 3);

        const recentProperties = properties
            .filter(p => p.status === 'pending')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 3);

        return {
            summary: {
                totalGuests,
                totalHosts,
                activeGuests,
                activeHosts,
                totalProperties,
                activeProperties,
                totalRevenue
            },
            activityData,
            recentHosts,
            recentProperties
        };
    }

    private generateTimeSeriesData(users: any[], properties: any[], days: number) {
        const data: any[] = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const guests = users.filter(u => 
                u.role === UserRole.USER && 
                u.createdAt.toISOString().split('T')[0] === dateStr
            ).length;
            
            const hosts = users.filter(u => 
                u.role === UserRole.HOST && 
                u.createdAt.toISOString().split('T')[0] === dateStr
            ).length;
            
            const props = properties.filter(p => 
                p.createdAt.toISOString().split('T')[0] === dateStr
            ).length;
            
            data.push({
                date: dateStr,
                guests,
                hosts,
                properties: props
            });
        }
        
        return data;
    }
}
