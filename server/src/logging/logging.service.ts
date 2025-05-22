import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';

@Injectable()
export class LoggingService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: { service: 'beer-app' },
      transports: [
        // Write all logs with importance level of 'info' or less to combined.log
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        }),
        // Write all logs with importance level of 'error' or less to error.log
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        }),
      ],
    });

    // If we're not in production, log to the console with colors
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple(),
          format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          })
        ),
      }));
    }
  }

  // Log methods for different levels
  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  // Specific business event logging methods
  logBeerAdded(participantId: string, barrelId?: string | null) {
    this.info('Beer added to participant', {
      event: 'BEER_ADDED',
      participantId,
      barrelId,
    });
  }

  logBeerRemoved(participantId: string, barrelId?: string | null) {
    this.info('Beer removed from participant', {
      event: 'BEER_REMOVED',
      participantId,
      barrelId,
    });
  }

  logBarrelCreated(barrelId: string, size: number) {
    this.info('New barrel created', {
      event: 'BARREL_CREATED',
      barrelId,
      size,
    });
  }

  logBarrelDeleted(barrelId: string) {
    this.info('Barrel deleted', {
      event: 'BARREL_DELETED',
      barrelId,
    });
  }

  logParticipantCreated(participantId: string, name: string) {
    this.info('New participant created', {
      event: 'PARTICIPANT_CREATED',
      participantId,
      name,
    });
  }

  logParticipantDeleted(participantId: string) {
    this.info('Participant deleted', {
      event: 'PARTICIPANT_DELETED',
      participantId,
    });
  }

  logCleanup(type: 'BARRELS' | 'PARTICIPANTS' | 'ALL') {
    this.info('Cleanup performed', {
      event: 'CLEANUP',
      type,
    });
  }
} 