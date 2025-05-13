// server/db/index.ts
import { getDb, initSecureDatabase } from "./rls/secure-drizzle";

// Initialize the database on startup with error handling
async function initializeDatabase() {
  try {
    console.log("Initializing secure database...");
    await initSecureDatabase();
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // In a production environment, you might want to exit the process
    // process.exit(1);
  }
}

// Call the initialization function
await initializeDatabase();

// Export the db instance
export const db = getDb();

// Secure RLS-aware database (drizzle + session-based access)
export {
  initSecureDatabase,
  getDb,
  createSecureClient,
} from "./rls/secure-drizzle";
