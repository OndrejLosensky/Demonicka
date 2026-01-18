#!/bin/bash

# Stress Test Runner Script
# This script helps you run the beer addition stress test with Artillery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo -e "${RED}Error: Artillery is not installed${NC}"
    echo -e "${YELLOW}Install it with: npm install -g artillery${NC}"
    exit 1
fi

# Load .env.test if it exists (do this BEFORE checking variables)
if [ -f .env.test ]; then
    echo -e "${GREEN}Loading environment variables from .env.test${NC}"
    # Export variables from .env.test, ignoring comments and empty lines
    export $(cat .env.test | grep -v '^#' | grep -v '^$' | xargs)
fi

# Check for required environment variables
if [ -z "$ARTILLERY_EVENT_ID" ] || [ -z "$ARTILLERY_USER_ID" ] || [ -z "$ARTILLERY_USERNAME" ] || [ -z "$ARTILLERY_PASSWORD" ]; then
    echo -e "${YELLOW}Error: Required environment variables not set${NC}"
    echo ""
    echo "Please create a .env.test file in this directory with:"
    echo "  ARTILLERY_EVENT_ID=your-event-id"
    echo "  ARTILLERY_USER_ID=your-user-id"
    echo "  ARTILLERY_USERNAME=your-username"
    echo "  ARTILLERY_PASSWORD=your-password"
    echo ""
    echo "You can copy the example file:"
    echo "  cp .env.test.example .env.test"
    echo ""
    echo "Then edit .env.test with your actual values"
    echo ""
    echo "Alternatively, you can export them manually:"
    echo "  export ARTILLERY_EVENT_ID=your-event-id"
    echo "  export ARTILLERY_USER_ID=your-user-id"
    echo "  export ARTILLERY_USERNAME=your-username"
    echo "  export ARTILLERY_PASSWORD=your-password"
    exit 1
fi

echo -e "${GREEN}Starting stress test...${NC}"
echo "  Target: http://localhost:3000"
echo "  Event ID: $ARTILLERY_EVENT_ID"
echo "  User ID: $ARTILLERY_USER_ID"
echo "  Username: $ARTILLERY_USERNAME"
echo ""

# Generate timestamp for unique report filenames
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_JSON="report_${TIMESTAMP}.json"
REPORT_HTML="report_${TIMESTAMP}.html"

# Run the test with JSON output
echo -e "${GREEN}Running stress test...${NC}"
artillery run add-beer-stress-test.yml --output "$REPORT_JSON"

# Check if report was generated
if [ -f "$REPORT_JSON" ]; then
    echo ""
    echo -e "${GREEN}Generating HTML report...${NC}"
    artillery report "$REPORT_JSON" --output "$REPORT_HTML"
    
    if [ -f "$REPORT_HTML" ]; then
        echo ""
        echo -e "${GREEN}✅ Reports generated successfully!${NC}"
        echo ""
        echo "📊 Reports:"
        echo "  - JSON: $REPORT_JSON (machine-readable for dashboards)"
        echo "  - HTML: $REPORT_HTML (view in browser)"
        echo ""
        echo "To view the HTML report, open it in your browser:"
        echo "  open $REPORT_HTML"
        echo ""
        echo "📈 The JSON report can be used for creating dashboards"
    else
        echo -e "${YELLOW}Warning: HTML report generation may have failed${NC}"
    fi
else
    echo -e "${RED}Error: Report JSON file was not generated${NC}"
    exit 1
fi
