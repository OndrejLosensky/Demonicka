# Stress Testing with Artillery

This directory contains stress tests for the Demonicka application using [Artillery](https://www.artillery.io/).

## Prerequisites

1. **Install Artillery**:
   ```bash
   npm install -g artillery
   # or
   pnpm add -g artillery
   ```

2. **Ensure your server is running**:
   ```bash
   cd apps/server
   pnpm run start:dev
   ```

3. **Get test credentials and IDs**:
   
   **Username & Password**: These are credentials for an **existing user account** in your Demonicka app. You can:
   - Use any user account that already exists in your database
   - Use the account you log in with to the web app
   - Or create a new user via `POST /api/v1/auth/register` or through the admin interface
   
   **Event ID**: The UUID of an active event in your database. Get it from:
   - The Events page in the web app (check the URL)
   - Your database directly
   - Or create a new event through the API/web app
   
   **User ID**: The UUID of a user who will be adding beers during the test. This user must:
   - Exist in your database
   - Be a participant in the Event ID above
   - Can be the same as the username's user ID, or a different user

## Running the Beer Addition Stress Test

The `add-beer-stress-test.yml` file tests the beer addition endpoint under various load conditions.

### Easy Way: Using .env.test File (Recommended)

1. **Copy the example file**:
   ```bash
   cd tests
   cp .env.test.example .env.test
   ```

2. **Edit `.env.test`** with your actual values:
   ```env
   ARTILLERY_EVENT_ID=your-actual-event-id
   ARTILLERY_USER_ID=your-actual-user-id
   ARTILLERY_USERNAME=your-actual-username
   ARTILLERY_PASSWORD=your-actual-password
   ```

3. **Run the test** using the helper script:
   ```bash
   ./run-stress-test.sh
   ```
   
   Or run Artillery directly (the script automatically loads .env.test):
   ```bash
   # The script will automatically load .env.test
   ./run-stress-test.sh
   ```

### Manual Way: Using Environment Variables

If you prefer to export environment variables manually:

```bash
export ARTILLERY_EVENT_ID=your-event-id
export ARTILLERY_USER_ID=your-user-id
export ARTILLERY_USERNAME=your-username
export ARTILLERY_PASSWORD=your-password

cd tests
artillery run add-beer-stress-test.yml
```

### Test Phases

The test runs in four phases:

1. **Warm up** (30s): 5 requests/second - Gradually increases load
2. **Sustained load** (2min): 10 requests/second - Steady moderate load
3. **Spike test** (30s): 25 requests/second - Moderate burst of traffic
4. **Cool down** (30s): 5 requests/second - Gradually decreases load

### Reports and Dashboards

**Automatic Report Generation**: The `run-stress-test.sh` script automatically generates timestamped reports:
- **JSON report** (`report_YYYYMMDD_HHMMSS.json`): Machine-readable data for dashboards
- **HTML report** (`report_YYYYMMDD_HHMMSS.html`): Visual report you can open in a browser

**View HTML Report**:
```bash
# The script automatically generates it, then open it:
open report_20250118_014729.html

# Or on Linux:
xdg-open report_20250118_014729.html

# Or on Windows:
start report_20250118_014729.html
```

**Using JSON Reports for Dashboards**:

The JSON report contains structured data you can use to build dashboards:

```json
{
  "aggregate": {
    "latency": {
      "mean": 4872.3,
      "median": 4676.2,
      "p95": 9801.2,
      "p99": 9999.2
    },
    "rps": { "mean": 27 },
    "scenariosCreated": 4350,
    "scenariosCompleted": 48,
    "errors": {
      "ETIMEDOUT": 4277,
      "Failed capture or match": 25
    },
    "codes": {
      "201": 1210,
      "500": 25
    }
  },
  "phases": [...],
  "latencies": [...],
  "scenariosCreated": 4350,
  "scenariosCompleted": 48
}
```

You can parse these JSON reports with:
- **Python**: Use `json` module or `pandas` for analysis
- **JavaScript/Node.js**: Use `fs.readFileSync()` to load JSON
- **Excel/Google Sheets**: Import JSON and create charts
- **BI Tools**: Import JSON into Power BI, Tableau, Grafana, etc.

**Example Python script** to extract metrics:
```python
import json

with open('report_20250118_014729.json') as f:
    data = json.load(f)

aggregate = data['aggregate']
print(f"Success Rate: {aggregate['codes'].get('201', 0) / aggregate['scenariosCreated'] * 100:.2f}%")
print(f"Mean Latency: {aggregate['latency']['mean']:.2f}ms")
print(f"P95 Latency: {aggregate['latency']['p95']:.2f}ms")
```

## What Gets Tested

- **Authentication flow**: Login endpoint performance
- **Beer addition endpoint**: `/api/v1/events/:eventId/beers/users/:userId`
- **Concurrent requests**: Multiple simultaneous beer additions
- **Response times**: P50, P95, P99 latencies
- **Error rates**: Should stay under 1%
- **Database concurrency**: Testing transaction handling

## Metrics to Monitor

During the test, watch for:

1. **Response times**: Should stay reasonable (< 500ms for p95)
2. **Error rates**: Should be low (< 1%)
3. **Server logs**: Check for database connection issues, timeouts
4. **Database**: Monitor connection pool usage and query performance
5. **Memory**: Should remain stable (no leaks)

## Adjusting Load

Edit `add-beer-stress-test.yml` to modify:

- **arrivalRate**: Requests per second
- **duration**: How long each phase runs
- **phases**: Add or remove test phases

Example - More aggressive test:
```yaml
phases:
  - duration: 60
    arrivalRate: 100
    name: "High load"
```

## Troubleshooting

### "401 Unauthorized"
- Check username/password are correct
- Ensure the user has proper permissions

### "404 Not Found"
- Verify EVENT_ID and USER_ID are correct
- Ensure the user is a participant in the event

### "Connection refused"
- Make sure the server is running on `http://localhost:3000`
- Check the `target` in the config file

### High error rates
- Check server logs for database connection issues
- Monitor database connection pool limits
- Reduce `arrivalRate` if the server can't handle the load

## Report Parsing and Dashboard Creation

### Quick Report Summary

Use the included parser script to get a quick summary:

```bash
# After running a test, parse the latest report
node parse-report.js report_20250118_014729.json

# Output as JSON for programmatic use
node parse-report.js report_20250118_014729.json --json
```

The parser extracts:
- Request metrics (total, completed, failed, success rate)
- Latency metrics (mean, median, P95, P99, min, max)
- Response codes (200, 201, 404, 500, etc.)
- Error counts by type
- Throughput (requests/second)
- Phase information

### Creating Dashboards

**1. JSON Import**:
The JSON reports can be imported into:
- **Grafana**: Create time-series dashboards
- **Excel/Google Sheets**: Import JSON → Create charts
- **Python/Pandas**: Analyze trends over time
- **Custom dashboards**: Use the parsed metrics

**2. Collecting Multiple Reports**:
Store reports with timestamps to track performance over time:

```bash
# Create a reports directory
mkdir -p reports/history

# Run tests and archive reports
./run-stress-test.sh
mv report_*.json report_*.html reports/history/
```

**3. Example Dashboard Queries**:

Track performance trends:
```python
import json
import glob

reports = sorted(glob.glob('reports/history/report_*.json'))
for report in reports[-10:]:  # Last 10 reports
    data = json.load(open(report))
    print(f"{report}: P95={data['aggregate']['latency']['p95']}ms")
```

**4. Visualizations**:
- **Line charts**: Track latency (P95, P99) over time
- **Bar charts**: Success vs error rates per test run
- **Heatmaps**: Error types by phase
- **Gauges**: Current success rate, throughput

## Next Steps

Future test scenarios to add:

- [ ] Multiple users adding beers simultaneously
- [ ] Beer Pong game start concurrency test
- [ ] WebSocket connection stress test
- [ ] Leaderboard update broadcast test
- [ ] Dashboard stats load test
