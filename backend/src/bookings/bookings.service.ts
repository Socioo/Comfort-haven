import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
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
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private notificationsService: NotificationsService,
    ) { }

    create(createBookingDto: CreateBookingDto) {
        const booking = this.bookingsRepository.create(createBookingDto);
        return this.bookingsRepository.save(booking);
    }

    findAll() {
        return this.bookingsRepository.find({ relations: ['property', 'guest'] });
    }

    findOne(id: string) {
        return this.bookingsRepository.findOne({ where: { id }, relations: ['property', 'property.owner', 'guest'] });
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
        amount: number; // in NGN
        metadata: {
            propertyId: string;
            guestId: string;
            startDate: string;
            endDate: string;
            guests: number;
        };
    }) {
        try {
            // Find the property and its owner
            const property = await this.propertiesRepository.findOne({
                where: { id: data.metadata.propertyId },
                relations: ['owner']
            });

            if (!property) {
                throw new NotFoundException('Property not found');
            }

            const paystackData: any = {
                email: data.email,
                amount: Math.round(data.amount * 100), // convert to kobo
                metadata: data.metadata,
                callback_url: 'comforthaven://payment-callback',
            };

            // If the host has a Paystack subaccount, split the payment
            // Platform keeps 10%, Host gets 90% (as configured in the subaccount)
            if (property.owner?.paystackSubaccountCode) {
                paystackData.subaccount = property.owner.paystackSubaccountCode;
            }

            const response = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                paystackData,
                {
                    headers: {
                        Authorization: `Bearer ${this.paystackSecret}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.data; // { authorization_url, access_code, reference }
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException('Failed to initialize payment: ' + (error.response?.data?.message || error.message));
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

            const savedBooking = await this.bookingsRepository.save(booking);

            // Send notifications asynchronously (don't block the response)
            this.sendBookingNotifications(savedBooking, metadata).catch(err =>
                console.error('Error sending booking notifications:', err)
            );

            return savedBooking;
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Failed to verify payment: ' + error.message);
        }
    }

    private async sendBookingNotifications(booking: Booking, metadata: any) {
        try {
            // Find the property with its owner
            const property = await this.propertiesRepository.findOne({
                where: { id: metadata.propertyId },
                relations: ['owner'],
            });

            const propertyTitle = property?.title || 'your property';
            const checkIn = new Date(metadata.startDate).toLocaleDateString();
            const checkOut = new Date(metadata.endDate).toLocaleDateString();

            // 1. Notify the guest
            await this.notificationsService.create(metadata.guestId, {
                type: 'booking_confirmed',
                title: 'Booking Confirmed!',
                message: `Your booking for "${propertyTitle}" from ${checkIn} to ${checkOut} has been confirmed.`,
                metadata: { bookingId: booking.id, propertyId: metadata.propertyId },
            });

            // 2. Notify the host (property owner)
            if (property?.ownerId) {
                await this.notificationsService.create(property.ownerId, {
                    type: 'new_booking',
                    title: 'New Booking Received',
                    message: `A guest has booked "${propertyTitle}" from ${checkIn} to ${checkOut}.`,
                    metadata: { bookingId: booking.id, propertyId: metadata.propertyId },
                });
            }

            // 3. Notify all admins
            await this.notificationsService.notifyAdmins({
                type: 'new_booking',
                title: 'New Booking',
                message: `A new booking has been confirmed for "${propertyTitle}" from ${checkIn} to ${checkOut}.`,
                metadata: { bookingId: booking.id, propertyId: metadata.propertyId },
            });
        } catch (err) {
            console.error('Failed to send booking notifications:', err);
        }
    }
}
