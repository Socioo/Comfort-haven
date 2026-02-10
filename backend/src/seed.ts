import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedingService } from './seeding/seeding.service';
import { SeedingModule } from './seeding/seeding.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedingService = app.select(SeedingModule).get(SeedingService);

    try {
        await seedingService.seed();
    } catch (error) {
        console.error('Seeding failed', error);
    } finally {
        await app.close();
    }
}
bootstrap();
