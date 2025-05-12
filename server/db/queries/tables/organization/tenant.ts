import { z } from "zod";
import { insertTenantSchema, tenant } from "../../../schema/tenant";
import { extendZodWithOpenApi } from "zod-openapi";
import { db } from "../../..";
import { eq } from "drizzle-orm";
extendZodWithOpenApi(z);

export const createTenantSchema = insertTenantSchema
  .omit({
    id: true,
  })
  .openapi({
    title: "Create Tenant",
    description: "Schema for creating an tenant after inserting into Auth0",
  });

export const createTenant = async (
  tenant_params: z.infer<typeof createTenantSchema>
) => {
  const result = await db.insert(tenant).values(tenant_params).returning();

  if (result.length === 0) {
    throw new Error("Tenant not created");
  }

  return result[0]!;
};

export const getTenantFromId = async (id: string) => {
  const result = await db
    .select()
    .from(tenant)
    .where(eq(tenant.id, id))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Tenant not created");
  }

  return result[0]!;
};
