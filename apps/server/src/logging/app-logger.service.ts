import { Injectable, type LoggerService } from '@nestjs/common';
import { LoggingService } from './logging.service';

function toMessage(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof Error) return input.message;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

/**
 * NestJS LoggerService adapter that forwards framework/service logs
 * into the Winston-backed `LoggingService` (daily rotated JSON files).
 */
@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly logging: LoggingService) {}

  log(message: any, context?: string) {
    this.logging.info(toMessage(message), context ? { context } : undefined);
  }

  warn(message: any, context?: string) {
    this.logging.warn(toMessage(message), context ? { context } : undefined);
  }

  debug(message: any, context?: string) {
    this.logging.debug(toMessage(message), context ? { context } : undefined);
  }

  verbose(message: any, context?: string) {
    // Map verbose -> debug (keep one stream)
    this.logging.debug(toMessage(message), context ? { context } : undefined);
  }

  error(message: any, ...optionalParams: any[]) {
    // Nest commonly calls: error(message, trace?, context?)
    const [trace, context] = optionalParams;
    const meta: Record<string, unknown> = {};
    if (typeof context === 'string') meta.context = context;
    if (typeof trace === 'string') meta.trace = trace;
    this.logging.error(toMessage(message), Object.keys(meta).length ? meta : undefined);
  }

  // Optional in some Nest versions; safe no-op.
  setLogLevels?(_levels: string[]) {}
}

