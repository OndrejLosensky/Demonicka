#!/usr/bin/env node

/**
 * Parse Artillery JSON Report
 * 
 * Extracts key metrics from Artillery JSON reports for dashboard usage
 * 
 * Usage: node parse-report.js <report.json>
 */

const fs = require('fs');
const path = require('path');

function parseReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`Error: Report file not found: ${reportPath}`);
    process.exit(1);
  }

  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const aggregate = reportData.aggregate || {};

  // Extract key metrics
  const metrics = {
    timestamp: new Date().toISOString(),
    reportFile: path.basename(reportPath),
    
    // Request metrics
    totalRequests: aggregate.scenariosCreated || 0,
    completedRequests: aggregate.scenariosCompleted || 0,
    failedRequests: (aggregate.scenariosCreated || 0) - (aggregate.scenariosCompleted || 0),
    successRate: aggregate.scenariosCompleted 
      ? ((aggregate.scenariosCompleted / aggregate.scenariosCreated) * 100).toFixed(2) + '%'
      : '0%',
    
    // Response codes
    httpCodes: aggregate.codes || {},
    successCodes: (aggregate.codes?.['201'] || 0) + (aggregate.codes?.['200'] || 0),
    errorCodes: (aggregate.codes?.['500'] || 0) + (aggregate.codes?.['404'] || 0) + (aggregate.codes?.['401'] || 0),
    
    // Latency metrics
    latency: {
      mean: aggregate.latency?.mean?.toFixed(2) || 'N/A',
      median: aggregate.latency?.median?.toFixed(2) || 'N/A',
      p95: aggregate.latency?.p95?.toFixed(2) || 'N/A',
      p99: aggregate.latency?.p99?.toFixed(2) || 'N/A',
      min: aggregate.latency?.min?.toFixed(2) || 'N/A',
      max: aggregate.latency?.max?.toFixed(2) || 'N/A',
    },
    
    // Throughput
    requestsPerSecond: aggregate.rps?.mean?.toFixed(2) || 'N/A',
    
    // Errors
    errors: aggregate.errors || {},
    totalErrors: Object.values(aggregate.errors || {}).reduce((sum, count) => sum + count, 0),
    
    // Phase information
    phases: (reportData.phases || []).map(phase => ({
      name: phase.name || 'Unknown',
      duration: phase.duration || 0,
      arrivalRate: phase.arrivalRate || 0,
    })),
  };

  return metrics;
}

// Main execution
if (require.main === module) {
  const reportPath = process.argv[2];

  if (!reportPath) {
    console.error('Usage: node parse-report.js <report.json>');
    console.error('Example: node parse-report.js report_20250118_014729.json');
    process.exit(1);
  }

  try {
    const metrics = parseReport(reportPath);
    
    // Output as formatted text
    console.log('\n📊 Artillery Test Report Summary\n');
    console.log(`Report File: ${metrics.reportFile}`);
    console.log(`Timestamp: ${metrics.timestamp}\n`);
    
    console.log('📈 Request Metrics:');
    console.log(`  Total Requests: ${metrics.totalRequests}`);
    console.log(`  Completed: ${metrics.completedRequests}`);
    console.log(`  Failed: ${metrics.failedRequests}`);
    console.log(`  Success Rate: ${metrics.successRate}\n`);
    
    console.log('⏱️  Latency (ms):');
    console.log(`  Mean: ${metrics.latency.mean}`);
    console.log(`  Median: ${metrics.latency.median}`);
    console.log(`  P95: ${metrics.latency.p95}`);
    console.log(`  P99: ${metrics.latency.p99}`);
    console.log(`  Min: ${metrics.latency.min}`);
    console.log(`  Max: ${metrics.latency.max}\n`);
    
    console.log('🚀 Throughput:');
    console.log(`  Requests/Second: ${metrics.requestsPerSecond}\n`);
    
    console.log('✅ Response Codes:');
    Object.entries(metrics.httpCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
    console.log(`  Success (2xx): ${metrics.successCodes}`);
    console.log(`  Errors (4xx/5xx): ${metrics.errorCodes}\n`);
    
    if (metrics.totalErrors > 0) {
      console.log('❌ Errors:');
      Object.entries(metrics.errors).forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
      console.log(`  Total Errors: ${metrics.totalErrors}\n`);
    }
    
    // Optionally output as JSON for programmatic use
    if (process.argv.includes('--json')) {
      console.log('\n📋 JSON Output:\n');
      console.log(JSON.stringify(metrics, null, 2));
    }
  } catch (error) {
    console.error('Error parsing report:', error.message);
    process.exit(1);
  }
}

module.exports = { parseReport };
