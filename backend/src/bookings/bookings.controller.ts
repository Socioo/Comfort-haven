import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    create(@Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    findAll() {
        return this.bookingsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
        return this.bookingsService.update(id, updateBookingDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bookingsService.remove(id);
    }

    @Get('user/:userId')
    findByUser(
        @Param('userId') userId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
    ) {
        return this.bookingsService.findByUser(userId, { startDate, endDate, status });
    }

    @Get('property/:propertyId')
    findByProperty(
        @Param('propertyId') propertyId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
    ) {
        return this.bookingsService.findByProperty(propertyId, { startDate, endDate, status });
    }

    @Get('host/:hostId')
    findByHost(
        @Param('hostId') hostId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
    ) {
        return this.bookingsService.findByHost(hostId, { startDate, endDate, status });
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.bookingsService.cancel(id);
    }

    @Post('payment/initialize')
    initializePayment(@Body() body: {
        email: string;
        amount: number;
        metadata: {
            propertyId: string;
            guestId: string;
            startDate: string;
            endDate: string;
            guests: number;
        };
    }) {
        return this.bookingsService.initializePayment(body);
    }

    @Post('payment/verify')
    verifyPayment(@Body() body: { reference: string }) {
        return this.bookingsService.verifyPaymentAndBook(body.reference);
    }
}
