import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { UserRole } from '../common/constants';
import * as bcrypt from 'bcryptjs';

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
        // We can call seed here or wait for manual call
        // await this.seed();
    }

    async seed() {
        this.logger.log('Starting full database reset and seeding...');

        await this.clearDatabase();
        
        const password = await bcrypt.hash('password123', 10);
        
        const users = await this.seedUsers(password);
        const properties = await this.seedProperties(users);
        await this.seedBookings(users, properties);
        await this.seedFavorites(users, properties);

        this.logger.log('Seeding completed successfully!');
    }

    private async clearDatabase() {
        this.logger.log('Clearing existing data using raw SQL...');
        const tables = ['favorites', 'bookings', 'reviews', 'messages', 'properties', 'users'];
        for (const table of tables) {
            try {
                await this.usersRepository.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
                this.logger.log(`Truncated ${table}`);
            } catch (error) {
                this.logger.warn(`Could not truncate ${table}, trying DELETE: ${error.message}`);
                try {
                    await this.usersRepository.query(`DELETE FROM "${table}"`);
                } catch (delError) {
                    this.logger.error(`Failed to clear ${table}: ${delError.message}`);
                }
            }
        }
        this.logger.log('Data cleared.');
    }

    private async seedUsers(password: string): Promise<User[]> {
        this.logger.log('Seeding users (2 Admins, 20 Guests, 20 Hosts)...');
        const usersData: Partial<User>[] = [];

        // 1. Super Admin
        usersData.push({
            email: 'superadmin@comfort-haven.com',
            password,
            name: 'Super Admin',
            role: UserRole.ADMIN,
            isVerified: true,
            status: 'active',
            profileImage: 'https://images.unsplash.com/photo-1519085185750-74071747e99c?auto=format&fit=crop&w=256&q=80',
        });

        // 2. Sub Admin
        usersData.push({
            email: 'subadmin@comfort-haven.com',
            password,
            name: 'Sub Admin',
            role: UserRole.SUB_ADMIN,
            isVerified: true,
            status: 'active',
            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
        });

        // 3. 20 Guests
        for (let i = 1; i <= 20; i++) {
            usersData.push({
                email: `guest${i}@example.com`,
                password,
                name: `Guest ${i}`,
                role: UserRole.USER,
                isVerified: true,
                status: 'active',
                profileImage: `https://i.pravatar.cc/150?u=guest${i}`,
            });
        }

        // 4. 20 Hosts
        for (let i = 1; i <= 20; i++) {
            usersData.push({
                email: `host${i}@example.com`,
                password,
                name: `Host ${i}`,
                role: UserRole.HOST,
                isVerified: true,
                status: 'active',
                profileImage: `https://i.pravatar.cc/150?u=host${i}`,
            });
        }

        const usersEntities = this.usersRepository.create(usersData as any);
        this.logger.log(`Prepared ${usersData.length} users for seeding`);
        return await this.usersRepository.save(usersEntities);
    }

    private async seedProperties(users: User[]): Promise<Property[]> {
        this.logger.log('Seeding properties (at least 1 per host)...');
        const hosts = users.filter(u => u.role === UserRole.HOST);
        this.logger.log(`Found ${hosts.length} hosts in seeded users`);
        const propertiesData: Partial<Property>[] = [];

        const locations = ['Kano', 'Lagos', 'Abuja', 'Kaduna', 'Port Harcourt'];
        const lgas = ['Nassarawa', 'Municipal', 'Fagge', 'Gwale', 'Tarauni'];
        const categories = ['Apartment', 'Villa', 'Duplex', 'Studio', 'Penthouse'];
        const imagesList = [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1600596542815-22b4899975d6?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&w=800&q=80',
        ];

        // Ensure every host has at least one property
        for (const host of hosts) {
            propertiesData.push({
                title: `${categories[Math.floor(Math.random() * categories.length)]} by ${host.name}`,
                description: 'A beautiful and comfortable space managed by our top hosts.',
                price: Math.floor(Math.random() * 50000) + 10000,
                location: locations[Math.floor(Math.random() * locations.length)],
                lga: lgas[Math.floor(Math.random() * lgas.length)],
                owner: host,
                status: 'active',
                images: [imagesList[Math.floor(Math.random() * imagesList.length)], imagesList[Math.floor(Math.random() * imagesList.length)]],
                amenities: ['Wifi', 'AC', 'Kitchen', 'Parking'],
                rating: 4 + Math.random(),
                reviewCount: Math.floor(Math.random() * 20),
                bedrooms: Math.floor(Math.random() * 3) + 1,
                bathrooms: Math.floor(Math.random() * 2) + 1,
                guests: Math.floor(Math.random() * 4) + 1,
                latitude: 12.0022,
                longitude: 8.5920,
            });
        }

        // Add some extra random properties
        for (let i = 0; i < 10; i++) {
            const host = hosts[Math.floor(Math.random() * hosts.length)];
            propertiesData.push({
                title: `Extra Premium ${categories[i % categories.length]}`,
                description: 'A specially curated space for premium stay experiences.',
                price: Math.floor(Math.random() * 100000) + 50000,
                location: locations[i % locations.length],
                lga: lgas[i % lgas.length],
                owner: host,
                status: 'active',
                images: [imagesList[i % imagesList.length]],
                amenities: ['Wifi', 'Pool', 'AC', 'Security'],
                rating: 4.5 + Math.random() * 0.5,
                reviewCount: Math.floor(Math.random() * 40),
                bedrooms: 3,
                bathrooms: 3,
                guests: 6,
            });
        }

        const propertiesEntities = this.propertiesRepository.create(propertiesData as any);
        return await this.propertiesRepository.save(propertiesEntities);
    }

    private async seedBookings(users: User[], properties: Property[]) {
        this.logger.log('Seeding initial bookings...');
        const guests = users.filter(u => u.role === UserRole.USER);
        const bookingsData: Partial<Booking>[] = [];

        for (let i = 0; i < 15; i++) {
            const guest = guests[Math.floor(Math.random() * guests.length)];
            const property = properties[Math.floor(Math.random() * properties.length)];
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 15));
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);

            bookingsData.push({
                guest,
                property,
                startDate,
                endDate,
                totalPrice: property.price * 3,
                status: 'confirmed',
            });
        }

        const bookingsEntities = this.bookingsRepository.create(bookingsData as any);
        await this.bookingsRepository.save(bookingsEntities);
    }

    private async seedFavorites(users: User[], properties: Property[]) {
        this.logger.log('Seeding initial favorites...');
        const guests = users.filter(u => u.role === UserRole.USER);
        const favoritesData: Partial<Favorite>[] = [];

        for (const guest of guests.slice(0, 10)) {
            const randomProps = properties.sort(() => 0.5 - Math.random()).slice(0, 3);
            for (const prop of randomProps) {
                favoritesData.push({ user: guest, property: prop });
            }
        }

        const favoritesEntities = this.favoritesRepository.create(favoritesData as any);
        await this.favoritesRepository.save(favoritesEntities);
    }

    async fixImages() {
        // Implementation similar to previous but ensure it works with current entities
        this.logger.log('Fixing images (skipping as seeding provides them)...');
    }
}
