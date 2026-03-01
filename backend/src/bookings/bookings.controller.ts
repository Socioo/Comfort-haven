import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
    findByUser(@Param('userId') userId: string) {
        return this.bookingsService.findByUser(userId);
    }

    @Get('property/:propertyId')
    findByProperty(@Param('propertyId') propertyId: string) {
        return this.bookingsService.findByProperty(propertyId);
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.bookingsService.cancel(id);
    }
}
