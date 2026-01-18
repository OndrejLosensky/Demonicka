// Register tsconfig-paths for path mapping resolution
import 'tsconfig-paths/register';

// Crypto polyfill for @nestjs/schedule compatibility
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as typeof globalThis.crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable cookie parser
  app.use(cookieParser());

  // Enable WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS with credentials
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      const allowedOrigins = [
        configService.get('FRONTEND_URL') || 'http://localhost:5173',
        /^http:\/\/localhost:[0-9]+$/,
        /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$/,
        /^http:\/\/100\.96\.[0-9]+\.[0-9]+:[0-9]+$/,
        /^http:\/\/192\.168\.[0-9]+\.[0-9]+:[0-9]+$/,
      ];

      // Check if the origin matches any of the allowed patterns
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-api-version'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Serve static files for profile pictures
  app.useStaticAssets(join(process.cwd(), 'uploads', 'profile-pictures'), {
    prefix: '/api/uploads/profile-pictures',
  });


  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Note: JWT auth guard is registered as APP_GUARD in AuthModule
  // No need to register it globally here to avoid conflicts

  // Listen on port 3000 or the port specified in the environment
  await app.listen(process.env.PORT ?? 3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
