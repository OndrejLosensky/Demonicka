/**
 * OpenTelemetry tracing bootstrap. Must be imported first in main.ts so that
 * auto-instrumentation can patch Node/Express/Prisma before any app code runs.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const traceEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  'http://localhost:4318/v1/traces';

const exporter = new OTLPTraceExporter({
  url: traceEndpoint,
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME || 'demonicka-server',
    [SemanticResourceAttributes.SERVICE_VERSION]:
      process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version || '0.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.OTEL_DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV || 'development',
  }),
});

/**
 * Start the OpenTelemetry SDK. Must be awaited before the app handles requests
 * so that traces are correctly exported (e.g. to Tempo).
 */
export async function startTracing(): Promise<void> {
  await sdk.start();
  console.log('[OpenTelemetry] Tracing started, exporting to', traceEndpoint);
}
