import env from "./server/lib/config/env";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import { fruits } from "./server/db/schema/test_rls/fruits";
import { tenantUser } from "./server/db/schema/tenantUser";
import { tenant } from "./server/db/schema/tenant";
import { createSecureClient, db } from "./server/db";

await db.delete(fruits).where(eq(fruits.name, "test-tables-fruit"));
await db.delete(tenantUser).where(eq(tenantUser.name, "test-tables-admin"));
await db.delete(tenant).where(eq(tenant.name, "test-tables-organization"));

const insertedOrganization = await db
  .insert(tenant)
  .values({
    name: "test-tables-organization",
    authId: "auth|test-tables-organization",
    securityLevel: "RLS",
  })
  .returning();

console.log(insertedOrganization);

const insertedAdmin = await db
  .insert(tenantUser)
  .values({
    name: "test-tables-admin",
    authId: "auth|test-tables-admin",
    tenantId: insertedOrganization[0]!.id,
    email: "test-tables-admin@example.com",
  })
  .returning();

console.log(insertedAdmin);

const authDb = createSecureClient(insertedAdmin[0]!.authId!);

const userAuthId = await authDb.query(
  (db) =>
    db.execute(sql`SELECT auth.get_user_id()`) as unknown as Promise<string>
);

console.log(userAuthId);

const insertedFruit = await authDb.query((db) =>
  db
    .insert(fruits)
    .values({
      name: "test-tables-fruit",
      color: "red",
      tenantId: insertedOrganization[0]!.id,
    })
    .returning()
);

console.log(insertedFruit);
