import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PropertiesService } from '../properties/properties.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
    constructor(
        private readonly bookingsService: BookingsService,
        private readonly propertiesService: PropertiesService
    ) { }

    @Post()
    create(@Req() req: any, @Body() createBookingDto: CreateBookingDto) {
        // Force the guestId to the current user for security
        if (req.user.role !== UserRole.SUPER_ADMIN) {
            createBookingDto.guestId = req.user.id;
        }
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FINANCE)
    findAll() {
        return this.bookingsService.findAll();
    }

    @Get(':id')
    async findOne(@Req() req: any, @Param('id') id: string) {
        const booking = await this.bookingsService.findOne(id);
        if (!booking) throw new NotFoundException('Booking not found');
        
        // Allow if guest, host, or admin
        const isGuest = booking.guestId === req.user.id;
        const isHost = booking.property?.ownerId === req.user.id;
        const isAdmin = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FINANCE].includes(req.user.role);

        if (!isGuest && !isHost && !isAdmin) {
            throw new UnauthorizedException('You do not have access to this booking');
        }

        return booking;
    }

    @Patch(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
    update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
        return this.bookingsService.update(id, updateBookingDto);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    remove(@Param('id') id: string) {
        return this.bookingsService.remove(id);
    }

    @Get('user/:userId')
    findByUser(
        @Req() req: any,
        @Param('userId') userId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
    ) {
        if (req.user.id !== userId && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You can only see your own bookings');
        }
        return this.bookingsService.findByUser(userId, { startDate, endDate, status });
    }

    @Get('property/:propertyId')
    async findByProperty(
        @Req() req: any,
        @Param('propertyId') propertyId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
    ) {
        // Need to check if user owns the property
        const property = await this.propertiesService.findOne(propertyId);
        if (!property) throw new NotFoundException('Property not found');

        if (property.ownerId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You do not own this property');
        }

        return this.bookingsService.findByProperty(propertyId, { startDate, endDate, status });
    }

    @Get('host/:hostId')
    findByHost(
        @Req() req: any,
        @Param('hostId') hostId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
    ) {
        if (req.user.id !== hostId && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You can only see bookings for your own properties');
        }
        return this.bookingsService.findByHost(hostId, { startDate, endDate, status });
    }

    @Post(':id/cancel')
    async cancel(@Req() req: any, @Param('id') id: string) {
        const booking = await this.bookingsService.findOne(id);
        if (!booking) throw new NotFoundException('Booking not found');

        if (booking.guestId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You can only cancel your own bookings');
        }

        return this.bookingsService.cancel(id);
    }

    @Post('payment/initialize')
    initializePayment(@Req() req: any, @Body() body: any) {
        // Ensure guestId matches current user
        if (req.user.role !== UserRole.SUPER_ADMIN) {
            body.metadata.guestId = req.user.id;
            body.email = req.user.email;
        }
        return this.bookingsService.initializePayment(body);
    }

    @Post('payment/verify')
    verifyPayment(@Body() body: { reference: string }) {
        return this.bookingsService.verifyPaymentAndBook(body.reference);
    }
}
