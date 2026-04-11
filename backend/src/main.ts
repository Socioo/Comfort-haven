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
import { seedSuperAdmin } from './seed-super-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security middleware
  app.use(helmet());

  // Configure CORS
  const corsOrigin = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
    : true; // fallback to true if not defined to prevent breaking dev 

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
  
  // Seed the default super-admin if it doesn't exist
  await seedSuperAdmin(app);
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📜 Swagger docs on http://localhost:${port}/api/docs`);
  console.log(`✨ tRPC running on http://localhost:${port}/trpc`);
}

bootstrap().catch(err => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});