import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

@Injectable()
export class BookingsService {
    private get paystackSecret(): string {
        return process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_key_here';
    }

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

    async initializePayment(data: {
        email: string;
        amount: number; // in kobo (multiply NGN by 100)
        metadata: {
            propertyId: string;
            guestId: string;
            startDate: string;
            endDate: string;
            guests: number;
        };
    }) {
        try {
            const response = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                {
                    email: data.email,
                    amount: Math.round(data.amount * 100), // convert to kobo
                    metadata: data.metadata,
                    callback_url: 'comforthaven://payment-callback',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.paystackSecret}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.data; // { authorization_url, access_code, reference }
        } catch (error) {
            throw new BadRequestException('Failed to initialize payment: ' + error.message);
        }
    }

    async verifyPaymentAndBook(reference: string) {
        try {
            // Verify payment with Paystack
            const verifyResponse = await axios.get(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                {
                    headers: { Authorization: `Bearer ${this.paystackSecret}` },
                }
            );

            const { status, metadata, amount } = verifyResponse.data.data;

            if (status !== 'success') {
                throw new BadRequestException('Payment verification failed: transaction not successful');
            }

            // Create the booking now payment is confirmed
            const booking = this.bookingsRepository.create({
                propertyId: metadata.propertyId,
                guestId: metadata.guestId,
                startDate: metadata.startDate,
                endDate: metadata.endDate,
                totalPrice: amount / 100, // convert back from kobo
                status: 'confirmed',
                paymentReference: reference,
            });

            return this.bookingsRepository.save(booking);
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Failed to verify payment: ' + error.message);
        }
    }
}
