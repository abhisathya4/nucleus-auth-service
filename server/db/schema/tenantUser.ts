import {
  index,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { tenant } from "./tenant";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
extendZodWithOpenApi(z);

export const tenantUser = pgTable(
  "tenant_user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id), // Changed to reference tenant.id
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    authId: text("auth_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tenantUser) => [
    uniqueIndex("admin_email_idx").on(tenantUser.email),
    uniqueIndex("admin_auth_id_idx").on(tenantUser.authId),
    index("admin_name_idx").on(tenantUser.name),
    index("admin_org_id_idx").on(tenantUser.tenantId),
  ]
);

export const selectTenantUserSchema = createSelectSchema(tenantUser, {
  id: z.string().uuid().openapi({
    description: "Unique identifier for the tenant user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  tenantId: z.string().uuid().openapi({
    description: "Unique identifier for the tenant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  email: z.string().email().openapi({
    description: "Email address of the tenant user",
    example: "tenant user@example.com",
  }),
  name: z.string().openapi({
    description: "Name of the tenant user",
    example: "John Doe",
  }),
  authId: z.string().nullable().openapi({
    description: "Unique identifier for the tenant user in auth0",
    example: "kp_12847sedsn8174610djc765s",
  }),
  createdAt: z.preprocess(
    (val) => (val instanceof Date ? val.toISOString() : val),
    z.string().datetime().openapi({
      description: "Timestamp when the tenant user was created",
      example: "2023-01-01T00:00:00.000Z",
    })
  ),
});

export const insertTenantUserSchema = createInsertSchema(tenantUser, {
  id: z
    .string()
    .uuid()
    .optional()
    .openapi({ description: "Unique identifier for the tenant user" }),
  tenantId: z.string().uuid().openapi({
    description: "Unique identifier for the tenant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  email: z.string().email().openapi({
    description: "Email address of the tenant user",
    example: "tenant_user@example.com",
  }),
  name: z.string().openapi({
    description: "Name of the tenant user",
    example: "John Doe",
  }),
  authId: z.string().nullable().openapi({
    description: "Unique identifier for the tenant user in auth0",
    example: "kp_12847sedsn8174610djc765s",
  }),
  createdAt: z.string().datetime().optional().openapi({
    description: "Timestamp when the tenant user was created",
    example: "2023-01-01T00:00:00.000Z",
  }),
}).openapi({
  title: "Insert Tenant User",
  description: "Schema for inserting tenant user data",
  required: ["organizationId", "email", "name", "authId"],
});
