// server/db/rls/secure-drizzle.ts
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { RLSTokenManager } from "./RLSTokenManager";
import env from "../../lib/config/env";
import { getSSLConfig } from "../../lib/config/db-config";

let tokenManager: RLSTokenManager;
let pgPool: postgres.Sql;
let db: PostgresJsDatabase;

/**
 * Initializes the secure DB connection using pg_session_jwt and RLSTokenManager.
 * Must be called once at startup.
 */
export async function initSecureDatabase() {
  try {
    tokenManager = await new RLSTokenManager(
      env.ED25519_SIGNING_KEY,
      env.ED25519_PUBLIC_KEY
    ).init(env.AUTH0_DOMAIN, env.AUTH0_AUDIENCE || env.AUTH0_DOMAIN, "Auth0");

    // Get the appropriate SSL configuration
    const sslConfig = getSSLConfig();

    console.log(
      `Database connection will ${sslConfig ? "use" : "not use"} SSL`
    );

    const jwkJsonString = JSON.stringify(tokenManager.Jwk);

    // Escape any *single quotes* to safely embed inside SQL connection string
    const escapedJwkJson = jwkJsonString.replace(/'/g, "''");

    console.log(
      "Final pg_session_jwt.jwk GUC:",
      `-c pg_session_jwt.jwk=${escapedJwkJson}`
    );


    pgPool = postgres(env.DATABASE_URL!, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: sslConfig,
      connection: {
        // The JWK string must be passed *as a literal* in single quotes
        options: `-c pg_session_jwt.jwk=${escapedJwkJson}`,
      },
      onnotice: (notice) => console.log("Database notice:", notice),
      debug: process.env.NODE_ENV !== "production",
      onclose: () => console.log("Database connection closed"),
    });

    // Test the connection
    await pgPool`SELECT 1 AS connection_test`;
    console.log("Database connection test successful");

    db = drizzle(pgPool);
    console.log("Initialized Secure DB");
  } catch (err) {
    console.error("Failed to initialize secure DB:", err);
    throw err;
  }
}

/**
 * Returns the initialized drizzle client (admin scope).
 */
export function getDb(): PostgresJsDatabase {
  if (!db)
    throw new Error(
      "Secure DB not initialized. Call initSecureDatabase() first."
    );
  return db;
}

/**
 * Returns the underlying pgPool.
 */
export function getPgPool(): postgres.Sql {
  if (!pgPool)
    throw new Error(
      "Secure DB not initialized. Call initSecureDatabase() first."
    );
  return pgPool;
}

/**
 * Creates a scoped secure client with JWT-based RLS session.
 * @param authToken JWT token signed with Ed25519
 */
export async function createSecureClient(authToken: string) {
  if (!authToken) {
    throw new Error("Auth token is required for secure client creation");
  }

  const pool = getPgPool();
  try {
    const dbToken = await tokenManager.createSecureDbToken(authToken, "Auth0");

    return {
      /**
       * Runs a secure query with an isolated transaction + RLS session.
       */
      async query<T>(
        queryFn: (db: PostgresJsDatabase) => Promise<T>
      ): Promise<T> {
        try {
          console.log("Passing token to pg_session_jwt:", dbToken);

          // @ts-expect-error
          return pool.begin<T>(async (tx) => {
            await tx.unsafe("SELECT auth.init()");
            await tx.unsafe("SELECT auth.jwt_session_init($1)", [dbToken]);

            const txDrizzle = drizzle(tx);
            return queryFn(txDrizzle); // don't double await here
          });
        } catch (error) {
          console.error("Error in secure query execution:", error);
          throw error;
        }
      },

      /**
       * Runs multiple secure operations in a single JWT-scoped transaction.
       */
      async transaction<T>(
        txFn: (
          db: PostgresJsDatabase,
          tx: postgres.TransactionSql<{}>
        ) => Promise<T>
      ): Promise<T> {
        try {
          // @ts-expect-error
          return await pool.begin(async (tx) => {
            await tx.unsafe("SELECT auth.init()");
            await tx.unsafe("SELECT auth.jwt_session_init($1)", [dbToken]);

            const txDrizzle = drizzle(tx);
            return await txFn(txDrizzle, tx);
          });
        } catch (error) {
          console.error("Error in secure transaction execution:", error);
          throw error;
        }
      },
    };
  } catch (error) {
    console.error("Error creating secure client:", error);
    throw new Error(
      `Failed to create secure client: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
