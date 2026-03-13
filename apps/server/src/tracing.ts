/**
 * OpenTelemetry tracing bootstrap. Must be imported first in main.ts so that
 * auto-instrumentation can patch Node/Express/Prisma before any app code runs.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const traceEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  'http://localhost:4318/v1/traces';

const exporter = new OTLPTraceExporter({
  url: traceEndpoint,
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('[OpenTelemetry] Tracing started, exporting to', traceEndpoint);
