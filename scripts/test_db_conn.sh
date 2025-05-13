#!/bin/bash
# This script performs database connectivity tests to help diagnose issues

DATABASE_URL="${DATABASE_URL}"
if [ -z "$DATABASE_URL" ]; then
  # Try to get it from .env file if not set in environment
  if [ -f .env.dev ]; then
    export $(grep -v '^#' .env.dev | xargs)
    DATABASE_URL="${DATABASE_URL}"
  elif [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    DATABASE_URL="${DATABASE_URL}"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

echo "Testing database connectivity..."
echo "--------------------------------"

# Install psql if needed
if ! command -v psql &> /dev/null; then
  echo "PostgreSQL client not found. Installing..."
  apt-get update && apt-get install -y postgresql-client
fi

# Basic connection test
echo "Testing basic connection..."
if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
  echo "✅ Basic connection successful"
else
  echo "❌ Basic connection failed"
  echo "Detail: Unable to connect to the database with the provided URL"
  echo "Actions:"
  echo "  - Check if the database server is running"
  echo "  - Verify the DATABASE_URL is correct"
  echo "  - Check network connectivity to the database server"
  echo "  - Verify firewall settings allow the connection"
  exit 1
fi

# Test connection with SSL
echo "Testing SSL connection..."
if psql "$DATABASE_URL" -c "SHOW ssl" | grep -q "on"; then
  echo "✅ SSL is enabled"
else
  echo "⚠️ SSL is not enabled"
fi

# Test auth schema
echo "Testing auth schema existence..."
if psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'" | grep -q "auth"; then
  echo "✅ Auth schema exists"
else
  echo "⚠️ Auth schema does not exist. This may cause RLS issues."
fi

# Test RLS functions
echo "Testing RLS functions..."
if psql "$DATABASE_URL" -c "SELECT proname FROM pg_proc WHERE proname LIKE 'jwt_session%' OR proname LIKE '%auth%'" | grep -q "jwt"; then
  echo "✅ RLS functions exist"
else
  echo "⚠️ RLS functions may not be properly set up"
fi

echo "--------------------------------"
echo "Database tests complete. If you're still experiencing issues:"
echo "1. Check that ED25519_SIGNING_KEY and ED25519_PUBLIC_KEY are properly set"
echo "2. Verify RLS policies are correctly configured"
echo "3. Make sure your JWT claims match the expected format by your RLS policies"

echo "Testing database connection from Node.js..."
if command -v node &> /dev/null; then
  cat > /tmp/test-db.js << 'EOF'
const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connection successful');
    
    const res = await client.query('SELECT NOW()');
    console.log(`Current database time: ${res.rows[0].now}`);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

testConnection();
EOF

  if npm list pg &> /dev/null || npm install pg &> /dev/null; then
    echo "Running Node.js connection test..."
    node /tmp/test-db.js
  else
    echo "❌ Could not install pg module for Node.js test"
  fi
fi