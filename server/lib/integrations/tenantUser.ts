import type { z } from "zod";
import type { postTenantUserSchema } from "../../shared/integrations/tenantUser";
import { auth0 } from "../apis/auth0";
import { getTenantFromId } from "../../db/queries/tables/organization/tenant";
import { createTenantUser } from "../../db/queries/tables/organization/tenantUser";
import { insertTenantUserSchema } from "../../db/schema/tenantUser";

export const postTenantUser = async (
  tenantUser_params: z.infer<typeof postTenantUserSchema>
) => {
  const { tenantId: organizationId, ...auth0_admin_params } = tenantUser_params;
  const auth0_user = await auth0.Users.createUser({
    ...auth0_admin_params,
    verify_email: true,
    email_verified: false,
    connection: "email",
  });

  const organization = await getTenantFromId(organizationId);

  await auth0.Organizations.addMembers({
    id: organization.authId,
    members: [auth0_user.user_id],
  });

  const validated = insertTenantUserSchema.parse({
    ...tenantUser_params,
    authId: auth0_user.user_id,
  });

  const db_tenantUser = await createTenantUser(validated);

  return { db_tenantUser, auth0_user };
};
