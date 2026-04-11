import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UserRole } from './common/constants';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

export async function seedSuperAdmin(app: INestApplication) {
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.warn('Skipping super-admin seeding: SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set.');
    return;
  }

  try {
    const existingAdmin = await userRepository.findOne({ where: { email: superAdminEmail } });
    
    if (!existingAdmin) {
      console.log(`Setting up default super-admin: ${superAdminEmail}`);
      
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
      
      const newAdmin = userRepository.create({
        email: superAdminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        isVerified: true,
        status: 'active',
        mustChangePassword: true, // Force password change on first login
      });

      await userRepository.save(newAdmin);
      console.log('Super-admin created successfully.');
    } else {
      console.log('Super-admin already exists. Skipping creation.');
    }
  } catch (error) {
    console.error('Failed to seed super-admin:', error);
  }
}
