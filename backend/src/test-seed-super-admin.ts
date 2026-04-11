import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedSuperAdmin } from './seed-super-admin';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from './common/constants';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  console.log('--- Starting Super Admin Seeding Test ---');
  
  // Create application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // 1. Check if SUPER_ADMIN_EMAIL is set
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    
    if (!email || !password) {
      console.error('❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not set in .env');
      return;
    }

    console.log(`Target Email: ${email}`);

    // 2. Run the seed function
    await seedSuperAdmin(app);

    // 3. Verify the result
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const admin = await userRepository.findOne({ 
      where: { email: email } 
    });

    if (admin) {
      console.log('✅ Verification Successful!');
      console.log(`User Name: ${admin.name}`);
      console.log(`User Role: ${admin.role}`);
      console.log(`User ID: ${admin.id}`);
      
      if (admin.role === UserRole.SUPER_ADMIN) {
        console.log('🏆 Role confirmation: SUCCESS');
      } else {
        console.error(`❌ Role confirmation: FAILED (Found '${admin.role}', expected 'super-admin')`);
      }
    } else {
      console.error('❌ Verification Failed: User not found in database after seeding.');
    }

  } catch (error) {
    console.error('💥 Test Execution Failed:', error);
  } finally {
    await app.close();
    console.log('--- Test Completed ---');
  }
}

bootstrap();
