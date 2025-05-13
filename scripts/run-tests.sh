#!/bin/bash
set -e

# Create test results directory if it doesn't exist
mkdir -p test-results

# Run tests using both compose files
echo "Starting tests..."
docker-compose --env-file .env.test -f docker-compose.yml -f docker-compose.test.yml up \
  --build \
  --exit-code-from test-runner

# Store the exit code
TEST_EXIT_CODE=$?

# Clean up
echo "Cleaning up test environment..."
docker-compose -f docker-compose.yml -f docker-compose.test.yml down

# Exit with the test runner's exit code
exit $TEST_EXIT_CODE