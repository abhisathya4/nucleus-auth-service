import { sql } from "drizzle-orm";
import {
  uuid,
  text,
  pgTable,
  pgEnum,
  index,
  pgPolicy,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
extendZodWithOpenApi(z);

export const securityLevel = pgEnum("security_level", [
  "RLS",
  "DB",
  "Dedicated",
]);

export const tenant = pgTable(
  "tenant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    securityLevel: securityLevel("security_level").notNull().default("RLS"),
    authId: text("auth_id").notNull().unique(),
    name: text("name").notNull(),
  },
  (tenant) => [
    index("tenant_name_idx").on(tenant.name),
    index("tenant_security_level_idx").on(tenant.securityLevel),
    uniqueIndex("tenant_auth_id_idx").on(tenant.authId),
    pgPolicy("tenant_rls_policy", {
      as: "permissive",
      to: "neondb_owner",
      for: "all",
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
).enableRLS();

export const selectTenantSchema = createSelectSchema(tenant, {
  id: z
    .string()
    .uuid()
    .openapi({ description: "Unique identifier for the tenant" }),
  securityLevel: z
    .enum(["RLS", "DB", "Dedicated"])
    .openapi({ description: "Security level for the tenant" }),
  name: z.string().openapi({ description: "Name of the tenant" }),
  authId: z.string().openapi({
    description: "Unique identifier for the tenant in auth0",
  }),
}).openapi({
  title: "Select Tenant",
  description: "Schema for selecting tenant data",
});

export const insertTenantSchema = createInsertSchema(tenant, {
  id: z
    .string()
    .uuid()
    .optional()
    .openapi({ description: "Unique identifier for the tenant" }),
  securityLevel: z.enum(["RLS", "DB", "Dedicated"]).optional().openapi({
    description: "Security level for the tenant",
    example: "RLS",
    default: "RLS",
  }),
  name: z.string().openapi({ description: "Name of the tenant" }),
  authId: z.string().openapi({
    description: "Unique identifier for the tenant in auth0",
  }),
}).openapi({
  title: "Insert Tenant",
  description: "Schema for inserting tenant data",
  required: ["name"],
});
