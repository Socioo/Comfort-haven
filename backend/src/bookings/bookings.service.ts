import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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

    findByUser(userId: string, filters?: { startDate?: string; endDate?: string; status?: string }) {
        const where: any = { guestId: userId };
        
        if (filters?.startDate && filters?.endDate) {
            where.startDate = Between(new Date(filters.startDate), new Date(filters.endDate));
        } else if (filters?.startDate) {
            where.startDate = MoreThanOrEqual(new Date(filters.startDate));
        } else if (filters?.endDate) {
            where.startDate = LessThanOrEqual(new Date(filters.endDate));
        }

        if (filters?.status) {
            const statuses = filters.status.split(',');
            where.status = In(statuses);
        }

        return this.bookingsRepository.find({
            where,
            relations: ['property'],
            order: { startDate: 'DESC' }
        });
    }

    findByProperty(propertyId: string, filters?: { startDate?: string; endDate?: string; status?: string }) {
        const where: any = { propertyId };

        if (filters?.startDate && filters?.endDate) {
            where.startDate = Between(new Date(filters.startDate), new Date(filters.endDate));
        }

        if (filters?.status) {
            const statuses = filters.status.split(',');
            where.status = In(statuses);
        }

        return this.bookingsRepository.find({
            where,
            relations: ['guest'],
            order: { startDate: 'DESC' }
        });
    }

    async findByHost(hostId: string, filters?: { startDate?: string; endDate?: string; status?: string }) {
        const query = this.bookingsRepository.createQueryBuilder('booking')
            .leftJoinAndSelect('booking.property', 'property')
            .leftJoinAndSelect('booking.guest', 'guest')
            .where('property.ownerId = :hostId', { hostId });

        if (filters?.startDate && filters?.endDate) {
            query.andWhere('booking.startDate BETWEEN :start AND :end', { 
                start: new Date(filters.startDate), 
                end: new Date(filters.endDate) 
            });
        }

        if (filters?.status) {
            const statuses = filters.status.split(',');
            query.andWhere('booking.status IN (:...statuses)', { statuses });
        }

        query.orderBy('booking.startDate', 'DESC');

        return query.getMany();
    }

    async cancel(id: string) {
        return this.bookingsRepository.update(id, { status: 'cancelled' });
    }
}
