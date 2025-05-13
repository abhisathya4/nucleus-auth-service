import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// for migrations in your own branch
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
console.log(process.env.DATABASE_URL);
await migrate(drizzle(migrationClient), {
  migrationsFolder: "./server/drizzle",
});
console.log("db migration complete");
