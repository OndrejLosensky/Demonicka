/**
 * Load .env before any other app code (including tracing) so that
 * OTEL_* and other env vars are available when tracing.ts is evaluated.
 * Must be the first import in main.ts.
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
