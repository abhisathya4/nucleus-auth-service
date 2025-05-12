import { z } from "zod";
import { postTenant } from "../integrations/tenant";
import type { createNewUserSchema } from "../../shared/flows/newUser";
import { postTenantUser } from "../integrations/tenantUser";

export const createNewUserFlow = async (
  params: z.infer<typeof createNewUserSchema>
) => {
  const tenant = await postTenant(params.tenant);
  const user = await postTenantUser({ ...params.user, tenantId: tenant.id });

  return { tenant, user };
};
