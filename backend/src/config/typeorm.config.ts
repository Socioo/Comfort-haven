import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

export default registerAs('typeorm', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  return {
    type: 'postgres',
    ...(hasDatabaseUrl 
      ? { url: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'postgres',
        }),
    entities: [User, __dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || !isProduction,
    autoLoadEntities: true,
    ssl: (isProduction || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : false,
  };
});
