// server/db/rls/secure-drizzle.ts
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import env from "../../lib/config/env";
import { getSSLConfig } from "../../lib/config/db-config";
import fs from "fs";
import path, { join } from "path";
import { sql } from "drizzle-orm";

let pgPool: postgres.Sql;
let db: PostgresJsDatabase;

let authPgPool: postgres.Sql;
let authDb: PostgresJsDatabase;

/**
 * Initializes the secure DB connection using transaction-scoped RLS.
 * Must be called once at startup.
 */
export async function initSecureDatabase() {
  try {
    const sslConfig = getSSLConfig();

    console.log(
      `Admin DB connection will ${sslConfig ? "use" : "not use"} SSL`
    );

    pgPool = postgres(env.DATABASE_URL!, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: sslConfig,
      onnotice: (notice) => console.log("Admin DB notice:", notice),
      debug: process.env.NODE_ENV !== "production",
      onclose: () => console.log("Admin DB connection closed"),
    });

    await pgPool`SELECT 1 AS connection_test`;
    db = drizzle(pgPool);
    console.log("Admin DB connection test successful");

    // Initialize the RLS setup SQL using admin DB
    await initRlsFunctions();

    // Initialize the authenticated DB pool
    console.log(
      `Authenticated DB connection will ${sslConfig ? "use" : "not use"} SSL`
    );

    authPgPool = postgres(env.DATABASE_AUTHENTICATED_URL!, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: sslConfig,
      onnotice: (notice) => console.log("Auth DB notice:", notice),
      debug: process.env.NODE_ENV !== "production",
      onclose: () => console.log("Auth DB connection closed"),
    });

    await authPgPool`SELECT 1 AS connection_test`;
    authDb = drizzle(authPgPool);
    console.log("Authenticated DB connection test successful");

    console.log("Initialized Secure DB");
  } catch (err) {
    console.error("Failed to initialize secure DB:", err);
    throw err;
  }
}

/**
 * Creates the necessary RLS functions by reading and executing SQL from a file.
 */
async function initRlsFunctions() {
  try {
    const absolutePath = join(import.meta.dir, "./sql/init_auth_schema.sql");
    const query = await Bun.file(absolutePath).text();
    await pgPool.unsafe(query);
    console.log("RLS functions initialized successfully from file");
  } catch (error) {
    console.error("Failed to initialize RLS functions from file:", error);
    throw error;
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
 * Creates a scoped secure client with UUID-based RLS session using authenticated pool.
 * @param userId The UUID of the current user
 */
export function createSecureClient(userId: string) {
  if (!userId) {
    throw new Error("User ID is required for secure client creation");
  }

  if (!authDb)
    throw new Error(
      "Authenticated DB not initialized. Call initSecureDatabase() first."
    );

  return {
    async query<T>(
      queryFn: (txDb: PostgresJsDatabase) => Promise<T>
    ): Promise<T> {
      try {
        return await authDb.transaction(async (txDb) => {
          await txDb.execute(sql`SELECT auth.init()`);
          await txDb.execute(sql`SELECT auth.set_user_id(${userId})`);
          return queryFn(txDb);
        });
      } catch (error) {
        console.error("Error in secure query execution:", error);
        throw error;
      }
    },

    async transaction<T>(
      txFn: (txDb: PostgresJsDatabase) => Promise<T>
    ): Promise<T> {
      try {
        return await authDb.transaction(async (txDb) => {
          await txDb.execute(sql`SELECT auth.init()`);
          await txDb.execute(sql`SELECT auth.set_user_id(${userId})`);
          return txFn(txDb);
        });
      } catch (error) {
        console.error("Error in secure transaction execution:", error);
        throw error;
      }
    },
  };
}
