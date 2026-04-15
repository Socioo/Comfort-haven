import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { appRouter } from './trpc/routers/_app';
import { createContext } from './trpc/trpc';
import * as dotenv from 'dotenv';

dotenv.config();

import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  // Ensure upload directories exist
  const uploadDirs = ['./uploads', './uploads/users'];
  uploadDirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        console.log(`📁 Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.warn(`⚠️ Warning: Could not create directory ${dir}. This might cause upload failures.`, err);
    }
  });

  console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️ Database Sync: ${process.env.DB_SYNCHRONIZE === 'true' ? 'ENABLED' : 'DISABLED'}`);

  const app = await NestFactory.create(AppModule);
  
  // Register global exception filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // Increase payload size for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security middleware
  // Security middleware with custom configurations
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // Configure CORS
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigin = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
    : (isProduction 
        ? ['https://comfort-haven-admin.web.app', 'https://comfort-haven-prod.web.app'] 
        : true);
  
  console.log(`🌐 Allowed CORS Origins: ${corsOrigin === true ? 'ALL (Development)' : corsOrigin.join(', ')}`);
  
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Comfort Haven API')
    .setDescription('The API documentation for the Comfort Haven backend.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // tRPC middleware
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📜 Swagger docs on http://localhost:${port}/api/docs`);
  console.log(`✨ tRPC running on http://localhost:${port}/trpc`);
}

bootstrap().catch(err => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});