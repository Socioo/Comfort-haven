// If you're using a separate config file, fix it like this:
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres', // NOT 'postgresql'
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'), // Provide a default value
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};



















// import { registerAs } from '@nestjs/config';
// import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// export default registerAs(
//   'database',
//   (): TypeOrmModuleOptions => ({
//     type: 'postgresql', // or 'mysql'
//     host: process.env.DB_HOST || 'localhost',
//     port: parseInt(process.env.DB_PORT) || 5432,
//     username: process.env.DB_USERNAME || 'postgres',
//     password: process.env.DB_PASSWORD || 'password',
//     database: process.env.DB_NAME || 'your_database',
//     entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//     synchronize: process.env.NODE_ENV !== 'production',
//     logging: process.env.NODE_ENV === 'development',
//     migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
//     migrationsRun: true,
//   }),
// );