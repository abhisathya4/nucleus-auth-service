import { eq } from "drizzle-orm";
import { db } from "../..";
import { tenantUser, selectTenantUserSchema } from "../../schema/tenantUser";
import type { z } from "zod";
import { insertTenantUserSchema } from "../../schema/tenantUser";

export const getTenantUserFromAuthId = async (authId: string) => {
  const tenantUserData = await db
    .select()
    .from(tenantUser)
    .where(eq(tenantUser.authId, authId))
    .limit(1);

  if (tenantUserData.length === 0) {
    throw Error("Tenant User not found");
  }

  return tenantUserData[0]!;
};

export const getTenantUserFromEmail = async (email: string) => {
  const tenantUserData = await db
    .select()
    .from(tenantUser)
    .where(eq(tenantUser.email, email))
    .limit(1);

  if (tenantUserData.length === 0) {
    throw Error("Tenant User not found");
  }

  return tenantUserData[0]!;
};

export const createTenantUserSchema = insertTenantUserSchema
  .omit({
    id: true,
    createdAt: true,
  })
  .openapi({
    title: "Create Tenant User",
    description: "Schema for creating a tenant user after inserting into Auth0",
  });

export const createTenantUser = async (
  tenant_user_params: z.infer<typeof createTenantUserSchema>
) => {
  const result = await db
    .insert(tenantUser)
    .values(tenant_user_params)
    .returning();
  return selectTenantUserSchema.array().parse(result);
};

export const updateTenantUserAuthId = async (id: string, authId: string) => {
  const result = await db
    .update(tenantUser)
    .set({ authId })
    .where(eq(tenantUser.id, id))
    .returning();
  return selectTenantUserSchema.array().parse(result);
};

export const getTenantUsersForTenant = async (organization_id: string) => {
  // RLS should kick in and filter by tenantId
  const adminData = await db
    .select()
    .from(tenantUser)
    .where(eq(tenantUser.tenantId, organization_id));

  return selectTenantUserSchema.array().parse(adminData);
};
