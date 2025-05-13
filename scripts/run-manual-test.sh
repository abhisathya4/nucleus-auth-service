#!/bin/bash
set -e

# Create test results directory if it doesn't exist
mkdir -p test-results

echo "Starting services for manual testing..."

# Start all services except test-runner
docker-compose --env-file .env.test -f docker-compose.yml -f docker-compose.manual.yml up -d provisioning-backend redis-persistent redis-inmemory freeradius

echo "Services are starting. Backend will be available at http://localhost:3000"
echo ""
echo "To view logs: docker-compose --env-file .env.test -f docker-compose.yml -f docker-compose.fallback.yml -f docker-compose.manual.yml logs -f"
echo "To stop all services: docker-compose --env-file .env.test -f docker-compose.yml -f docker-compose.fallback.yml -f docker-compose.manual.yml down"

# Show the status of the containers
echo "Container status:"
docker ps | grep -E 'provisioning-backend|redis|freeradius'

# Cleanup

