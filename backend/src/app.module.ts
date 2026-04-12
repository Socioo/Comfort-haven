import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { SeedingModule } from './seeding/seeding.module';
import { StatsModule } from './stats/stats.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { MailModule } from './mail/mail.module';
import { SupportModule } from './support/support.module';
import { FinanceModule } from './finance/finance.module';

import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { FaqsModule } from './faqs/faqs.module';
import { AiModule } from './ai/ai.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import typeormConfig from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 200,
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get<TypeOrmModuleOptions>('typeorm');
        if (!config) throw new Error('TypeORM configuration not found');
        return config;
      },
    }),
    AuthModule,
    UsersModule,
    PropertiesModule,
    BookingsModule,
    SeedingModule,
    StatsModule,
    FavoritesModule,
    ReviewsModule,
    MessagesModule,
    MailModule,
    SupportModule,
    FinanceModule,

    NotificationsModule,
    SettingsModule,
    FaqsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
