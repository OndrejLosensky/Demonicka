// tracer.js
const express = require("express");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { trace } = require("@opentelemetry/api");

// Configure OTLP exporter
const traceExporter = new OTLPTraceExporter({
  url: "http://194.182.86.102:4318/v1/traces", // Tempo HTTP endpoint
});

// Initialize SDK
const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: "terminal-test-service",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "local-dev",
  }),
});

async function main() {
  await sdk.start();
  console.log("Tracing initialized");

  const app = express();

  // Simple HTML UI to trigger different trace patterns
  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Tempo Trace Playground</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; background:#0f172a; color:#e5e7eb; }
      h1 { margin-bottom: 1rem; }
      .cards { display:flex; flex-wrap:wrap; gap:1rem; margin-top:1rem; }
      .card { background:#020617; border:1px solid #1f2937; border-radius:0.75rem; padding:1rem 1.25rem; max-width:260px; }
      .card h2 { font-size:1rem; margin:0 0 0.5rem; }
      .card p { font-size:0.875rem; color:#9ca3af; margin:0 0 0.75rem; }
      button { background:#2563eb; color:white; border:none; border-radius:999px; padding:0.4rem 0.9rem; font-size:0.85rem; cursor:pointer; }
      button:hover { background:#1d4ed8; }
      #status { margin-top:1.5rem; font-size:0.875rem; color:#9ca3af; }
      code { background:#020617; padding:0.1rem 0.3rem; border-radius:0.25rem; }
    </style>
  </head>
  <body>
    <h1>Tempo Trace Playground</h1>
    <p>Click a button to generate a trace, then inspect it in Tempo.</p>

    <div class="cards">
      <div class="card">
        <h2>Simple request</h2>
        <p>Single span with a few attributes. Fast, no children, no errors.</p>
        <button onclick="callEndpoint('/simple')">Send simple span</button>
      </div>

      <div class="card">
        <h2>Slow, nested work</h2>
        <p>Parent span with multiple nested spans, artificial delay, and events.</p>
        <button onclick="callEndpoint('/slow')">Send slow span</button>
      </div>

      <div class="card">
        <h2>Error scenario</h2>
        <p>Span that records an exception and marks <code>error = true</code>.</p>
        <button onclick="callEndpoint('/error-demo')">Send error span</button>
      </div>
    </div>

    <div id="status">Waiting for interaction…</div>

    <script>
      async function callEndpoint(path) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Calling ' + path + ' …';
        try {
          const res = await fetch(path);
          const text = await res.text();
          statusEl.textContent = '[' + res.status + '] ' + text;
        } catch (err) {
          statusEl.textContent = 'Request failed: ' + err;
        }
      }
    </script>
  </body>
</html>`);
  });

  const tracer = trace.getTracer("terminal-test-tracer");

  // 1) Simple, fast request: single span, minimal attributes
  app.get("/simple", async (req, res) => {
    tracer.startActiveSpan("simple-request", async (span) => {
      try {
        span.setAttribute("demo.kind", "simple");
        span.setAttribute("http.method", req.method);
        span.setAttribute("http.route", "/simple");
        span.addEvent("simple_start");
        span.addEvent("simple_end");
        res.send("Simple span generated");
      } finally {
        span.end();
      }
    });
  });

  // 2) Slow request: parent + two nested spans with delays
  app.get("/slow", async (req, res) => {
    tracer.startActiveSpan("slow-request", async (span) => {
      try {
        span.setAttribute("demo.kind", "slow");
        span.setAttribute("http.route", "/slow");
        span.addEvent("slow_start");

        // fake external call
        await new Promise((resolve) => {
          tracer.startActiveSpan("slow-external-api", async (child) => {
            try {
              child.setAttribute("demo.part", "external");
              child.addEvent("external_start");
              await new Promise((r) => setTimeout(r, 250));
              child.addEvent("external_end");
            } finally {
              child.end();
              resolve();
            }
          });
        });

        // fake db call
        await new Promise((resolve) => {
          tracer.startActiveSpan("slow-db-call", async (child) => {
            try {
              child.setAttribute("db.system", "postgres");
              child.setAttribute("db.statement", "SELECT pg_sleep(0.2)");
              child.addEvent("db_start");
              await new Promise((r) => setTimeout(r, 200));
              child.addEvent("db_end");
            } finally {
              child.end();
              resolve();
            }
          });
        });

        span.addEvent("slow_end");
        res.send("Slow trace with nested spans generated");
      } finally {
        span.end();
      }
    });
  });

  // 3) Error request: span records exception and error flag
  app.get("/error-demo", async (req, res) => {
    tracer.startActiveSpan("error-request", async (span) => {
      try {
        span.setAttribute("demo.kind", "error");
        span.setAttribute("http.route", "/error-demo");
        span.addEvent("error_scenario_start");

        // Simulated failure
        const err = new Error("Demo failure in /error-demo");
        span.recordException(err);
        span.setAttribute("error", true);
        span.addEvent("error_recorded");

        res.status(500).send("Error trace generated (check Tempo)");
      } finally {
        span.end();
      }
    });
  });

  const port = 3001;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start tracing/server", err);
  process.exitCode = 1;
});