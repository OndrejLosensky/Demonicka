/**
 * Performance test: add-beer flow (EventBeersService.create).
 *
 * Real measurement is done by the standalone script (no Jest ESM issues):
 *
 *   pnpm run measure:add-beer
 *
 * from apps/server. Requires DATABASE_URL. Use RUNS=10 for more samples.
 * Set SKIP_PERF_TESTS=1 to skip the script in CI.
 *
 * This spec is a placeholder so we can run test:perf and be reminded of the script.
 */

describe('Add beer performance', () => {
  it.skip('use pnpm run measure:add-beer for real measurement', () => {
    expect(process.env.DATABASE_URL || process.env.SKIP_PERF_TESTS).toBeDefined();
  });
});
