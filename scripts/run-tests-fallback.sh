#!/bin/bash
set -e

# Create test results directory if it doesn't exist
mkdir -p test-results

# Run tests using fallback compose file
echo "Starting tests with fallback approach (no health checks)..."
docker-compose --env-file .env.test -f docker-compose.yml -f docker-compose.fallback.yml up \
  --build \
  --exit-code-from test-runner

# Store the exit code
TEST_EXIT_CODE=$?

# Clean up
echo "Cleaning up test environment..."
docker-compose -f docker-compose.yml -f docker-compose.fallback.yml down

# Exit with the test runner's exit code
exit $TEST_EXIT_CODE

