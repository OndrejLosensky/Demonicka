import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Server configuration
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Frontend URL for CORS
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),

  // Database configuration
  DATABASE_URL: Joi.string().required(),

  // JWT configuration
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Rate limiting configuration
  RATE_LIMIT_POINTS: Joi.number().default(100),
  RATE_LIMIT_DURATION: Joi.number().default(60),

  // Logging configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
}); 