import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { RLSTokenManager } from "./RLSTokenManager";
import env from "../../lib/config/env";

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

    pgPool = postgres(env.DATABASE_URL!, {
      max: 20,
      ssl: true,
      connection: {
        options: `-c pg_session_jwt.jwk='${tokenManager.Jwk}'`,
      },
    });

    db = drizzle(pgPool);
    console.log("Initialized Secure DB")
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
  const pool = getPgPool();
  const dbToken = await tokenManager.createSecureDbToken(authToken, "Auth0");

  return {
    /**
     * Runs a secure query with an isolated transaction + RLS session.
     */
    async query<T>(
      queryFn: (db: PostgresJsDatabase) => Promise<T>
    ): Promise<T> {
      // @ts-expect-error
      return pool.begin<T>(async (tx) => {
        await tx.unsafe("SELECT auth.init()");
        await tx.unsafe("SELECT auth.jwt_session_init($1)", [dbToken]);

        const txDrizzle = drizzle(tx);
        return queryFn(txDrizzle); // don't double await here
      });
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
      // @ts-expect-error
      return await pool.begin(async (tx) => {
        await tx.unsafe("SELECT auth.init()");
        await tx.unsafe("SELECT auth.jwt_session_init($1)", [dbToken]);

        const txDrizzle = drizzle(tx);
        return await txFn(txDrizzle, tx);
      });
    },
  };
}
