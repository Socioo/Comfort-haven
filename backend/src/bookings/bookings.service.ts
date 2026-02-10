import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
    ) { }

    create(createBookingDto: CreateBookingDto) {
        const booking = this.bookingsRepository.create(createBookingDto);
        return this.bookingsRepository.save(booking);
    }

    findAll() {
        return this.bookingsRepository.find({ relations: ['property', 'guest'] });
    }

    findOne(id: string) {
        return this.bookingsRepository.findOne({ where: { id }, relations: ['property', 'guest'] });
    }

    update(id: string, updateBookingDto: UpdateBookingDto) {
        return this.bookingsRepository.update(id, updateBookingDto);
    }

    remove(id: string) {
        return this.bookingsRepository.delete(id);
    }
}
