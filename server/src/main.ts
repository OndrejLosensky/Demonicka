import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingService } from './logging/logging.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { ConfigService } from './config/config.service';
import { RateLimiterService } from './common/services/rate-limiter.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const loggingService = app.get<LoggingService>(LoggingService);
  const reflector = app.get<Reflector>(Reflector);
  const rateLimiterService = app.get<RateLimiterService>(RateLimiterService);

  // Enable cookie parser
  app.use(cookieParser());

  // Enable WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS with credentials
  app.enableCors({
    origin: configService.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

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

  // Set up global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(loggingService));

  // Set up global guards
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RateLimitGuard(rateLimiterService, reflector),
  );

  // Listen on port specified in config
  await app.listen(configService.port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
