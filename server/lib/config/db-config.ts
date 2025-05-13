// server/lib/config/db-config.ts
import env from "./env";

/**
 * Builds a database connection URL based on environment variables
 * and ensures proper SSL configuration.
 *
 * This function is useful for normalizing database URLs across
 * different environments (local, test, production).
 */
export function buildDatabaseUrl() {
  // Start with the provided DATABASE_URL
  let dbUrl = env.DATABASE_URL!;

  // For local development without SSL
  if (
    env.APPLICATION_STATE === "dev" &&
    !dbUrl.includes("ssl=") &&
    !dbUrl.includes("sslmode=")
  ) {
    // Add sslmode=disable if not already specified and we're in dev mode
    if (dbUrl.includes("?")) {
      dbUrl += "&sslmode=disable";
    } else {
      dbUrl += "?sslmode=disable";
    }
    console.log(
      "Development mode: Explicitly disabled SSL for database connection"
    );
  }

  // For production or when SSL is explicitly requested
  else if (env.APPLICATION_STATE === "prod" || dbUrl.includes("ssl=true")) {
    if (!dbUrl.includes("sslmode=")) {
      // Ensure we're using SSL in production
      if (dbUrl.includes("?")) {
        dbUrl += "&sslmode=require";
      } else {
        dbUrl += "?sslmode=require";
      }
      console.log("Production mode: Enforcing SSL for database connection");
    }
  }

  return dbUrl;
}

/**
 * Determines if SSL should be used for the database connection
 * based on the DATABASE_URL parameter and environment.
 */
export function shouldUseSSL() {
  const dbUrl = env.DATABASE_URL!;

  // Check for explicit SSL parameters
  if (dbUrl.includes("sslmode=disable") || dbUrl.includes("ssl=false")) {
    return false;
  }

  if (
    dbUrl.includes("sslmode=require") ||
    dbUrl.includes("sslmode=verify-ca") ||
    dbUrl.includes("sslmode=verify-full") ||
    dbUrl.includes("ssl=true")
  ) {
    return true;
  }

  // Default behavior based on environment
  return env.APPLICATION_STATE === "prod";
}

/**
 * Returns the SSL configuration object for postgres.js
 */
export function getSSLConfig() {
  if (!shouldUseSSL()) {
    return false;
  }

  // In development, we don't verify certificates
  if (env.APPLICATION_STATE === "dev") {
    return { rejectUnauthorized: false };
  }

  // In production, we verify certificates
  return { rejectUnauthorized: true };
}
