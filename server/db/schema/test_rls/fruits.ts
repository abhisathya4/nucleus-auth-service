import { sql } from "drizzle-orm";
import {
  index,
  pgPolicy,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import { tenant } from "../tenant";

extendZodWithOpenApi(z);

export const fruits = pgTable(
  "fruits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id),
  },
  (fruits) => [
    uniqueIndex("fruits_name_idx").on(fruits.name),
    index("fruits_color_idx").on(fruits.color),
    index("fruits_tenant_id_idx").on(fruits.tenantId),
    pgPolicy("fruits_rls_owner_policy", {
      as: "permissive",
      to: "nucleus_owner",
      for: "all",
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("fruits_org_isolation_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`tenant_id IN (
        SELECT tenant_id FROM "tenant_user" WHERE auth_id = auth.get_user_id()
      )`,
      withCheck: sql`tenant_id IN (
        SELECT tenant_id FROM "tenant_user" WHERE auth_id = auth.get_user_id()
      )`,
    }),
  ]
).enableRLS();

export const selectFruitSchema = createSelectSchema(fruits, {
  id: z.string().uuid().openapi({
    description: "Unique identifier for the fruit",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "Name of the fruit",
    example: "Apple",
  }),
  color: z.string().openapi({
    description: "Color of the fruit",
    example: "Red",
  }),
  tenantId: z.string().uuid().openapi({
    description: "Unique identifier for the tenant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});
