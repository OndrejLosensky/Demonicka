import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { JOB_QUEUE_ADAPTER } from './job-queue.adapter.interface';
import { InProcessJobQueueAdapter } from './in-process-job-queue.adapter';
import { JobHandlerRegistry } from './job-handler.registry';
import { JobQueueService } from './job-queue.service';
import { JobsGateway } from './jobs.gateway';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [JobsController],
  providers: [
    JobHandlerRegistry,
    {
      provide: JOB_QUEUE_ADAPTER,
      useClass: InProcessJobQueueAdapter,
    },
    JobQueueService,
    JobsGateway,
  ],
  exports: [JobQueueService, JobHandlerRegistry],
})
export class JobQueueModule {}
