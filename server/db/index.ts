import { getDb, initSecureDatabase } from "./rls/secure-drizzle";
await initSecureDatabase();
export const db = getDb();

// Secure RLS-aware database (drizzle + session-based access)
// Must call `initSecureDatabase()` at app startup
export {
  initSecureDatabase,
  getDb,
  createSecureClient,
} from "./rls/secure-drizzle";
