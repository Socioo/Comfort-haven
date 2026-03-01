import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { UserRole } from '../common/constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedingService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedingService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        @InjectRepository(Favorite)
        private favoritesRepository: Repository<Favorite>,
    ) { }

    async onApplicationBootstrap() {
        await this.seed();
        await this.fixImages();
    }

    async seed() {
        this.logger.log('Starting seeding...');

        await this.seedUsers();
        await this.seedProperties();
        await this.seedBookings();
        await this.seedFavorites();

        this.logger.log('Seeding completed!');
    }

    private async seedUsers() {
        const existingUsers = await this.usersRepository.count();
        if (existingUsers > 0) return;

        this.logger.log('Seeding users...');
        const usersData: Partial<User>[] = [];
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Admin
        usersData.push({
            email: 'admin@test.com',
            password: hashedPassword,
            name: 'Admin User',
            role: UserRole.ADMIN,
            isVerified: true,
            status: 'active',
            profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        });

        // 2. Host
        usersData.push({
            email: 'host@test.com',
            password: hashedPassword,
            name: 'John Host',
            role: UserRole.HOST,
            isVerified: true,
            status: 'active',
            profileImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        });

        // 3. Regular User
        usersData.push({
            email: 'user@test.com',
            password: hashedPassword,
            name: 'Jane User',
            role: UserRole.USER,
            isVerified: true,
            status: 'active',
            profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        });

        // Create additional Hosts
        for (let i = 1; i <= 5; i++) {
            usersData.push({
                email: `host${i}@example.com`,
                password: hashedPassword,
                name: `Host ${i}`,
                role: UserRole.HOST,
                isVerified: Math.random() > 0.3,
                status: Math.random() > 0.1 ? 'active' : 'suspended',
            });
        }

        // Create additional Guests
        for (let i = 1; i <= 5; i++) {
            usersData.push({
                email: `guest${i}@example.com`,
                password: hashedPassword,
                name: `Guest ${i}`,
                role: UserRole.USER,
                isVerified: true,
                status: Math.random() > 0.1 ? 'active' : 'banned',
            });
        }

        const users = this.usersRepository.create(usersData as any);
        await this.usersRepository.save(users);
    }

    private async seedProperties() {
        const existingProperties = await this.propertiesRepository.count();
        if (existingProperties > 0) return;

        this.logger.log('Seeding properties...');
        // Ensure we get the specific host we created
        const specificHost = await this.usersRepository.findOne({ where: { email: 'host@test.com' } });
        const otherHosts = await this.usersRepository.find({ where: { role: UserRole.HOST } });
        
        // Filter out specific host from other hosts to avoid duplication if needed, though random selection is fine
        const allHosts = specificHost ? [specificHost, ...otherHosts] : otherHosts;

        const propertiesData: Partial<Property>[] = [];

        const locations = ['Malibu, CA', 'Aspen, CO', 'New York, NY', 'Miami, FL', 'Austin, TX', 'Seattle, WA', 'Kano, Nigeria', 'Lagos, Nigeria', 'Abuja, Nigeria'];
        const lgas = ['Municipal', 'Ikeja', 'Lekki', 'Victoria Island', 'Yaba', 'Surulere', 'Ajah', 'Ikoyi', 'Maryland'];
        const titles = ['Sunset Villa', 'Cozy Cabin', 'Urban Loft', 'Beach House', 'Mountain Retreat', 'City Apartment', 'Luxury Duplex', 'Modern Studio'];
        const imagesList = [
             'https://images.unsplash.com/photo-1600596542815-22b4899975d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ];

        // Create properties for the specific host first
        if (specificHost) {
            for (let i = 0; i < 5; i++) {
                 propertiesData.push({
                    title: `My Host Property ${i + 1}`,
                    description: 'This is a property owned by the test host account.',
                    price: Math.floor(Math.random() * 400) + 50,
                    location: locations[Math.floor(Math.random() * locations.length)],
                    lga: lgas[Math.floor(Math.random() * lgas.length)],
                    owner: specificHost,
                    status: 'active',
                    images: [imagesList[i % imagesList.length], imagesList[(i + 1) % imagesList.length]],
                    amenities: ['Wifi', 'Pool', 'Kitchen', 'AC'],
                    rating: 4 + Math.random(),
                    reviewCount: Math.floor(Math.random() * 50),
                    bedrooms: Math.floor(Math.random() * 4) + 1,
                    bathrooms: Math.floor(Math.random() * 3) + 1,
                    guests: Math.floor(Math.random() * 6) + 2,
                    latitude: 6.5244 + (Math.random() - 0.5) * 0.1,
                    longitude: 3.3792 + (Math.random() - 0.5) * 0.1,
                });
            }
        }

        for (let i = 0; i < 20; i++) {
            const host = allHosts[Math.floor(Math.random() * allHosts.length)];
            propertiesData.push({
                title: `${titles[Math.floor(Math.random() * titles.length)]} ${i + 1}`,
                description: 'A beautiful place to stay with amazing amenities.',
                price: Math.floor(Math.random() * 400) + 50,
                location: locations[Math.floor(Math.random() * locations.length)],
                lga: lgas[Math.floor(Math.random() * lgas.length)],
                owner: host,
                status: ['active', 'pending', 'suspended'][Math.floor(Math.random() * 3)],
                images: [imagesList[i % imagesList.length], imagesList[(i + 1) % imagesList.length]],
                amenities: ['Wifi', 'Pool', 'Kitchen'],
                rating: 3 + Math.random() * 2,
                reviewCount: Math.floor(Math.random() * 100),
                bedrooms: Math.floor(Math.random() * 4) + 1,
                bathrooms: Math.floor(Math.random() * 3) + 1,
                guests: Math.floor(Math.random() * 6) + 2,
                latitude: 6.5244 + (Math.random() - 0.5) * 0.1,
                longitude: 3.3792 + (Math.random() - 0.5) * 0.1,
            });
        }

        const properties = this.propertiesRepository.create(propertiesData as any);
        await this.propertiesRepository.save(properties);
    }

    private async seedBookings() {
        const existingBookings = await this.bookingsRepository.count();
        if (existingBookings > 0) return;

        this.logger.log('Seeding bookings...');
        const specificUser = await this.usersRepository.findOne({ where: { email: 'user@test.com' } });
        const guests = await this.usersRepository.find({ where: { role: UserRole.USER } });
        const properties = await this.propertiesRepository.find();
        const bookingsData: Partial<Booking>[] = [];

        // Seed bookings for specific user
         if (specificUser) {
            for (let i = 0; i < 3; i++) {
                const property = properties[Math.floor(Math.random() * properties.length)];
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);

                 bookingsData.push({
                    guest: specificUser,
                    property,
                    startDate,
                    endDate,
                    totalPrice: property.price * 5,
                    status: 'confirmed',
                });
            }
        }

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
                totalPrice: property.price * 5, 
                status: ['pending', 'confirmed', 'cancelled', 'completed'][Math.floor(Math.random() * 4)],
            });
        }

        const bookings = this.bookingsRepository.create(bookingsData as any);
        await this.bookingsRepository.save(bookings);
    }

    private async seedFavorites() {
        const existingFavorites = await this.favoritesRepository.count();
        if (existingFavorites > 0) return;

        this.logger.log('Seeding favorites...');
        const user = await this.usersRepository.findOne({ where: { email: 'user@test.com' } });
        const properties = await this.propertiesRepository.find();

        if (user && properties.length > 0) {
            const favoritesData: Partial<Favorite>[] = [];

            // Add 5 random favorites for the test user
            for (let i = 0; i < 5; i++) {
                const property = properties[Math.floor(Math.random() * properties.length)];
                favoritesData.push({
                    user,
                    property
                });
            }

            const favorites = this.favoritesRepository.create(favoritesData as any);
            await this.favoritesRepository.save(favorites);
        }
    }


    async fixImages() {
        this.logger.log('Checking and fixing missing images...');

        // Fix Users
        const users = await this.usersRepository.find();
        const userImages = [
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
        ];

        for (const user of users) {
            if (!user.profileImage) {
                user.profileImage = userImages[Math.floor(Math.random() * userImages.length)];
                await this.usersRepository.save(user);
            }
        }

        // Fix Properties
        const properties = await this.propertiesRepository.find();
        const propertyImages = [
             'https://images.unsplash.com/photo-1600596542815-22b4899975d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
             'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ];

        for (const prop of properties) {
            if (!prop.images || prop.images.length === 0) {
                prop.images = [
                    propertyImages[Math.floor(Math.random() * propertyImages.length)],
                    propertyImages[Math.floor(Math.random() * propertyImages.length)]
                ];
                await this.propertiesRepository.save(prop);
            }
        }

        this.logger.log('Fixed missing images.');
    }
}
