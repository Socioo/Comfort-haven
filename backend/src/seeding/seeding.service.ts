import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Payout, Refund } from '../finance/entities/finance.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Faq } from '../faqs/entities/faq.entity';
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
        @InjectRepository(Payout)
        private payoutRepository: Repository<Payout>,
        @InjectRepository(Refund)
        private refundRepository: Repository<Refund>,
        @InjectRepository(Favorite)
        private favoritesRepository: Repository<Favorite>,
        @InjectRepository(Faq)
        private faqsRepository: Repository<Faq>,
    ) { }

    async onApplicationBootstrap() {
        this.logger.log('--- Post-Deployment Bootstrap Check ---');
        // Automatically ensure default admins exist on startup
        // We set forceUpdatePassword to true to ensure that passwords are correctly 
        // synchronized with the current environment variables (critical for Railway fixes).
        await this.createDefaultAdmins(false, true);
        this.logger.log('--- Bootstrap Check Complete ---');
    }

    async seed() {
        this.logger.log('Starting clear-slate reset (Super Admin only)...');

        await this.clearDatabase(true); // Pass true to only keep the Super Admin
        
        // We pass forceUpdate = true to ensure the password in .env is applied
        await this.createDefaultAdmins(true, true); 

        this.logger.log('Database reset to clean state (Super Admin only).');
    }

    async createDefaultAdmins(onlySuperAdmin: boolean = false, forceUpdatePassword: boolean = false) {
        this.logger.log(`Synchronizing administrative accounts (Only Super Admin: ${onlySuperAdmin}, Force Update: ${forceUpdatePassword})...`);
        
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@comfort-haven.com';
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
        
        const defaultPassword = await bcrypt.hash('Admin@123', 10);
        const superPassword = await bcrypt.hash(superAdminPassword, 10);
        
        let adminAccounts = [
            {
                email: superAdminEmail,
                name: 'Super Admin',
                role: UserRole.SUPER_ADMIN,
                profileImage: 'https://i.pravatar.cc/150?u=super-admin',
                specialPassword: superPassword
            },
            {
                email: 'manager@comfort-haven.com',
                name: 'Comfort Manager',
                role: UserRole.MANAGER,
                profileImage: 'https://i.pravatar.cc/150?u=manager',
            },
            {
                email: 'finance@comfort-haven.com',
                name: 'Finance Officer',
                role: UserRole.FINANCE,
                profileImage: 'https://i.pravatar.cc/150?u=finance',
            },
            {
                email: 'support@comfort-haven.com',
                name: 'Support Agent',
                role: UserRole.SUPPORT,
                profileImage: 'https://i.pravatar.cc/150?u=support',
            },
        ];

        if (onlySuperAdmin) {
            adminAccounts = [adminAccounts[0]];
        }

        for (const account of adminAccounts) {
            const existing = await this.usersRepository.findOne({ where: { email: account.email } });
            if (!existing) {
                this.logger.log(`Creating ${account.role} account: ${account.email}`);
                const user = this.usersRepository.create({
                    ...account,
                    password: account.specialPassword || defaultPassword,
                    isVerified: true,
                    status: 'active',
                });
                await this.usersRepository.save(user);
            } else {
                // If the user exists, we only update credentials if explicitly forced
                // (e.g. during a manual seed command)
                if (forceUpdatePassword) {
                    this.logger.log(`Updating credentials for ${account.email}`);
                    await this.usersRepository.update(existing.id, { 
                        role: account.role,
                        password: account.specialPassword || defaultPassword,
                        isVerified: true,
                        status: 'active'
                    });
                } else {
                    this.logger.log(`Skipping password update for ${account.email} (exists and no force flag)`);
                    // Still sync the role just in case
                    await this.usersRepository.update(existing.id, { role: account.role });
                }
            }
        }

        // Migrate any remaining legacy roles to new defaults
        await this.usersRepository.update({ role: 'admin' as any }, { role: UserRole.SUPER_ADMIN });
        await this.usersRepository.update({ role: 'sub-admin' as any }, { role: UserRole.MANAGER });
        this.logger.log('Legacy role migration complete.');
    }

    private async asyncClearTable(table: string) {
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

    private async clearDatabase(onlySuperAdmin: boolean = false) {
        this.logger.log(`Clearing existing data (Preserving Super Admin: ${onlySuperAdmin})...`);
        const dependentTables = ['faqs', 'favorites', 'refunds', 'payouts', 'bookings', 'reviews', 'messages', 'properties'];
        
        // 1. Truncate all dependent tables first
        for (const table of dependentTables) {
            await this.asyncClearTable(table);
        }

        // 2. Clear users
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@comfort-haven.com';
        
        try {
            if (onlySuperAdmin) {
                // Remove ALL users except the specific Super Admin email
                const deleteQuery = `DELETE FROM "users" WHERE "email" != '${superAdminEmail}'`;
                await this.usersRepository.query(deleteQuery);
                this.logger.log('All users except the primary Super Admin have been cleared.');
            } else {
                // Keep all administrative roles
                const adminRoles = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FINANCE, UserRole.SUPPORT, UserRole.ADMIN];
                const deleteQuery = `
                    DELETE FROM "users" 
                    WHERE "role" NOT IN (${adminRoles.map(r => `'${r}'`).join(',')})
                    AND "email" != '${superAdminEmail}'
                `;
                await this.usersRepository.query(deleteQuery);
                this.logger.log('Non-administrative users cleared.');
            }
        } catch (error) {
            this.logger.error(`Failed to selectively clear users: ${error.message}`);
            await this.asyncClearTable('users');
        }
        
        this.logger.log('Database reset complete.');
    }

    private async seedUsers(mockPassword: string): Promise<User[]> {
        this.logger.log('Seeding fresh users (2 Admins, 20 Guests, 20 Hosts)...');
        const usersData: Partial<User>[] = [];

        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Password123';
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

        // 1. Ensure Super Admin and Manager exist (using update or create logic)
        const admins = [
            {
                email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@comfort-haven.com',
                name: 'Super Admin',
                role: UserRole.SUPER_ADMIN,
                password: hashedPassword,
                profileImage: 'https://images.unsplash.com/photo-1519085185750-74071747e99c?auto=format&fit=crop&w=256&q=80',
            },
            {
                email: 'manager@comfort-haven.com',
                name: 'Comfort Manager',
                role: UserRole.MANAGER,
                password: mockPassword,
                profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
            }
        ];

        for (const admin of admins) {
            const existing = await this.usersRepository.findOne({ where: { email: admin.email } });
            if (!existing) {
                const newUser = this.usersRepository.create({
                    ...admin,
                    isVerified: true,
                    status: 'active',
                });
                await this.usersRepository.save(newUser);
            } else {
                // Just update the role and password to ensure it's correct
                await this.usersRepository.update(existing.id, { 
                    role: admin.role,
                    password: admin.password
                });
            }
        }


        // 3. 20 Guests
        for (let i = 1; i <= 20; i++) {
            usersData.push({
                email: `guest${i}@example.com`,
                password: mockPassword,
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
                password: mockPassword,
                name: `Host ${i}`,
                role: UserRole.HOST,
                isVerified: true,
                status: 'active',
                profileImage: `https://i.pravatar.cc/150?u=host${i}`,
            });
        }

        const seededManager = await this.usersRepository.findOne({ where: { role: UserRole.MANAGER } });
        const seededSuperAdmin = await this.usersRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } });

        const usersEntities = this.usersRepository.create(usersData as any);
        this.logger.log(`Prepared ${usersData.length} mock users for seeding`);
        const savedUsers = await this.usersRepository.save(usersEntities);
        
        return ([seededSuperAdmin, seededManager, ...savedUsers].filter((u): u is User => !!u));
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
        return await this.bookingsRepository.save(bookingsEntities);
    }

    private async seedPayouts(bookings: Booking[]) {
        this.logger.log('Seeding initial payouts...');
        const payoutsData: Partial<Payout>[] = [];

        for (let i = 0; i < 10; i++) {
            const booking = bookings[Math.floor(Math.random() * bookings.length)];
            payoutsData.push({
                booking,
                bookingId: booking.id,
                amount: booking.totalPrice * 0.9,
                status: 'Paid',
                method: 'Bank Transfer',
            });
        }

        const payoutsEntities = this.payoutRepository.create(payoutsData as any);
        await this.payoutRepository.save(payoutsEntities);
    }

    private async seedRefunds(bookings: Booking[]) {
        this.logger.log('Seeding initial refunds...');
        const refundsData: Partial<Refund>[] = [];

        for (let i = 0; i < 5; i++) {
            const booking = bookings[Math.floor(Math.random() * bookings.length)];
            refundsData.push({
                booking,
                bookingId: booking.id,
                amount: booking.totalPrice,
                reason: 'Booking cancellation',
                status: 'Approved',
            });
        }

        const refundsEntities = this.refundRepository.create(refundsData as any);
        await this.refundRepository.save(refundsEntities);
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

    private async seedFaqs() {
        this.logger.log('Seeding house rent FAQs...');
        const faqsData: Partial<Faq>[] = [
            {
                question: 'How do I pay for house rent?',
                answer: 'You can pay through the app using your wallet, debit card, or bank transfer. All payments are processed securely.',
                targetAudience: 'guest' as any
            },
            {
                question: 'Can I pay house rent in installments?',
                answer: 'This depends on the host\'s policy. Most hosts require full payment upfront, but some may offer monthly plans. Check the listing details for specific terms.',
                targetAudience: 'guest' as any
            },
            {
                question: 'What happens if I pay rent late?',
                answer: 'Late payments may incur a penalty fee as specified in your rental agreement. Please ensure you pay on time to avoid extra charges.',
                targetAudience: 'guest' as any
            },
            {
                question: 'Is my rent payment secure?',
                answer: 'Yes, all payments are processed through our secure payment gateway and held in escrow until check-in for your protection.',
                targetAudience: 'both' as any
            },
            {
                question: 'Can I get a refund if I cancel my booking?',
                answer: 'Refunds are subject to the host\'s cancellation policy which is displayed on the property listing at the time of booking.',
                targetAudience: 'guest' as any
            },
            {
                question: 'How do I set the rent for my property?',
                answer: 'Hosts can set and adjust the rent for their properties through the "My Listings" section in the host dashboard.',
                targetAudience: 'host' as any
            },
            {
                question: 'When do I receive the rent payment from guests?',
                answer: 'Rent payments are typically released to the host 24 hours after the guest\'s scheduled check-in time, or according to the payout schedule configured in your settings.',
                targetAudience: 'host' as any
            }
        ];

        const faqsEntities = this.faqsRepository.create(faqsData as any);
        await this.faqsRepository.save(faqsEntities);
    }

    async fixImages() {
        // Implementation similar to previous but ensure it works with current entities
        this.logger.log('Fixing images (skipping as seeding provides them)...');
    }
}
