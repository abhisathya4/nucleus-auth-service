#!/bin/bash
set -e

# Create test results directory if it doesn't exist
mkdir -p test-results

# Start the backend service only first
echo "Starting backend service for debugging..."
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d provisioning-backend

# Give it some time to initialize
echo "Waiting 30 seconds for backend to initialize..."
sleep 30

# Check backend container status
echo "Checking backend container status..."
docker ps | grep provisioning-backend

# Check backend logs
echo "Backend container logs:"
docker logs test-provisioning-backend

# Try to access the health endpoint
echo "Testing health endpoint..."
docker exec test-provisioning-backend curl -v http://localhost:3000/health || echo "Failed to access health endpoint"

# If it failed, try with 0.0.0.0
echo "Testing health endpoint with explicit IP..."
docker exec test-provisioning-backend curl -v http://0.0.0.0:3000/health || echo "Failed to access health endpoint with explicit IP"

# Print container IP
echo "Backend container IP:"
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' test-provisioning-backend

# Try to access from host
echo "Trying to access health endpoint from host..."
curl -v http://localhost:3000/health || echo "Failed to access health endpoint from host"

# Now run the tests
echo "Starting tests..."
docker-compose --env-file .env.test-f docker-compose.yml -f docker-compose.test.yml up \
  --build \
  --exit-code-from test-runner

# Store the exit code
TEST_EXIT_CODE=$?

# Clean up
echo "Cleaning up test environment..."
docker-compose -f docker-compose.yml -f docker-compose.test.yml down

# # Exit with the test runner's exit code
exit $TEST_EXIT_CODE

