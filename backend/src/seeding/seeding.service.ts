import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { UserRole } from '../common/constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedingService {
    private readonly logger = new Logger(SeedingService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
    ) { }

    async seed() {
        this.logger.log('Starting seeding...');

        await this.seedUsers();
        await this.seedProperties();
        await this.seedBookings();

        this.logger.log('Seeding completed!');
    }

    private async seedUsers() {
        const existingUsers = await this.usersRepository.count();
        if (existingUsers > 0) return;

        this.logger.log('Seeding users...');
        const usersData: Partial<User>[] = [];

        // Create Admin
        const hashedPassword = await bcrypt.hash('password123', 10);
        usersData.push({
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Admin User',
            role: UserRole.ADMIN,
            isVerified: true,
            status: 'active',
        });

        // Create Hosts
        for (let i = 1; i <= 10; i++) {
            usersData.push({
                email: `host${i}@example.com`,
                password: hashedPassword,
                name: `Host ${i}`,
                role: UserRole.HOST,
                isVerified: Math.random() > 0.3,
                status: Math.random() > 0.1 ? 'active' : 'suspended',
            });
        }

        // Create Guests
        for (let i = 1; i <= 10; i++) {
            usersData.push({
                email: `guest${i}@example.com`,
                password: hashedPassword,
                name: `Guest ${i}`,
                role: UserRole.USER,
                isVerified: true,
                status: Math.random() > 0.1 ? 'active' : 'banned',
            });
        }

        // Fix: Save iteratively or use create to avoid strict type issues with bulk save
        const users = this.usersRepository.create(usersData as any);
        await this.usersRepository.save(users);
    }

    private async seedProperties() {
        const existingProperties = await this.propertiesRepository.count();
        if (existingProperties > 0) return;

        this.logger.log('Seeding properties...');
        const hosts = await this.usersRepository.find({ where: { role: UserRole.HOST } });
        const propertiesData: Partial<Property>[] = [];

        const locations = ['Malibu, CA', 'Aspen, CO', 'New York, NY', 'Miami, FL', 'Austin, TX', 'Seattle, WA'];
        const titles = ['Sunset Villa', 'Cozy Cabin', 'Urban Loft', 'Beach House', 'Mountain Retreat', 'City Apartment'];

        for (let i = 0; i < 20; i++) {
            const host = hosts[Math.floor(Math.random() * hosts.length)];
            propertiesData.push({
                title: `${titles[Math.floor(Math.random() * titles.length)]} ${i + 1}`,
                description: 'A beautiful place to stay with amazing amenities.',
                price: Math.floor(Math.random() * 400) + 50,
                location: locations[Math.floor(Math.random() * locations.length)],
                owner: host,
                status: ['active', 'pending', 'suspended'][Math.floor(Math.random() * 3)],
                images: [],
                amenities: ['Wifi', 'Pool', 'Kitchen'],
            });
        }

        const properties = this.propertiesRepository.create(propertiesData as any);
        await this.propertiesRepository.save(properties);
    }

    private async seedBookings() {
        const existingBookings = await this.bookingsRepository.count();
        if (existingBookings > 0) return;

        this.logger.log('Seeding bookings...');
        const guests = await this.usersRepository.find({ where: { role: UserRole.USER } });
        const properties = await this.propertiesRepository.find();
        const bookingsData: Partial<Booking>[] = [];

        for (let i = 0; i < 20; i++) {
            const guest = guests[Math.floor(Math.random() * guests.length)];
            const property = properties[Math.floor(Math.random() * properties.length)];

            const startDate = new Date();
            startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);

            bookingsData.push({
                guest,
                property,
                startDate,
                endDate,
                totalPrice: property.price * 5, // Approximate
                status: ['pending', 'confirmed', 'cancelled', 'completed'][Math.floor(Math.random() * 4)],
            });
        }

        const bookings = this.bookingsRepository.create(bookingsData as any);
        await this.bookingsRepository.save(bookings);
    }
}
