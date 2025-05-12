import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import env from "../lib/config/env";

// for query purposes
const connectionString = env.DATABASE_URL;
export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient);

const authConnectionString = env.DATABASE_AUTHENTICATED_URL;
export const authClient = neon(authConnectionString);
export const authDb = drizzleNeon({ client: authClient });
