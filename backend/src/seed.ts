import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedingService } from './seeding/seeding.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedingService = app.get(SeedingService);
  
  try {
    await seedingService.seed();
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
