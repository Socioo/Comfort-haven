import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

@Injectable()
export class PropertiesService {
    private get paystackSecret(): string {
        return process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_key_here';
    }
    constructor(
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        private notificationsService: NotificationsService,
    ) { }

    async create(createPropertyDto: CreatePropertyDto) {
        const property = this.propertiesRepository.create(createPropertyDto);
        const savedProperty = await this.propertiesRepository.save(property);
        
        // Notify admins about new property submission
        try {
            await this.notificationsService.notifyAdmins({
                type: 'info',
                title: 'New Property Submission',
                message: `A new property "${savedProperty.title}" has been submitted for approval.`,
                metadata: { propertyId: savedProperty.id }
            });
        } catch (e) {
            console.error('Failed to send notification', e);
        }

        return savedProperty;
    }

    async findAll(status?: string, user?: any, showAll?: boolean) {
        const where: any = {};
        if (status) where.status = status;
        
        try {
            return await this.propertiesRepository.find({ where, relations: ['owner', 'reviews'] });
        } catch (error) {
            console.error('❌ Database error in PropertiesService.findAll:', error.message);
            throw error; // Re-throw to be caught by the Global Exception Filter
        }
    }

    findOne(id: string) {
        return this.propertiesRepository.findOne({ where: { id }, relations: ['owner', 'bookings', 'reviews'] });
    }

    update(id: string, updatePropertyDto: UpdatePropertyDto) {
        return this.propertiesRepository.update(id, updatePropertyDto);
    }

    remove(id: string) {
        return this.propertiesRepository.delete(id);
    }

    async findByHost(hostId: string) {
        return this.propertiesRepository.find({ where: { ownerId: hostId }, relations: ['reviews'] });
    }

    async search(query: any, user?: any, showAll?: boolean) {
        const where: any = { ...query };
        
        // Removed strict paymentStatus: 'paid' filter for guests
        
        return this.propertiesRepository.find({ 
            where,
            relations: ['owner', 'reviews']
        });
    }

    async initializeListingPayment(propertyId: string, email: string) {
        const property = await this.propertiesRepository.findOne({ where: { id: propertyId } });
        if (!property) throw new NotFoundException('Property not found');
        if (property.paymentStatus === 'paid') throw new BadRequestException('Listing fee already paid');

        const listingFeeAmount = 5000; // 5000 NGN

        try {
            const response = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                {
                    email: email,
                    amount: listingFeeAmount * 100, // convert to kobo
                    metadata: { propertyId },
                    callback_url: 'comforthaven://listing-payment-callback',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.paystackSecret}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.data; // { authorization_url, access_code, reference }
        } catch (error: any) {
            throw new BadRequestException('Failed to initialize listing payment: ' + (error.response?.data?.message || error.message));
        }
    }

    async verifyListingPayment(reference: string) {
        try {
            const verifyResponse = await axios.get(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                {
                    headers: { Authorization: `Bearer ${this.paystackSecret}` },
                }
            );

            const { status, metadata } = verifyResponse.data.data;

            if (status !== 'success') {
                throw new BadRequestException('Payment verification failed');
            }

            const propertyId = metadata.propertyId;
            const property = await this.propertiesRepository.findOne({ where: { id: propertyId } });
            if (!property) throw new NotFoundException('Property not found');

            property.paymentStatus = 'paid';
            property.status = 'active'; // or pending if admin approval required

            return await this.propertiesRepository.save(property);
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
            throw new BadRequestException('Failed to verify payment: ' + error.message);
        }
    }
}
