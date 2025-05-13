import type { z } from "zod";
import type { postTenantSchema } from "../../shared/integrations/tenant";
import { auth0 } from "../apis/auth0";
import { createTenant } from "../../db/queries/tables/tenant";
import type { Auth0Management } from "../apis/auth0/Auth0Management";

export const postTenant = async (
  tenant_params: z.infer<typeof postTenantSchema>
) => {
  const connections = await auth0.Connections.getConnections();
  const { securityLevel, ...auth0_params } = tenant_params;
  const passwordless_connections = connections.filter(
    (c) => c.name !== "Username-Password-Authentication"
  );
  const enabled_connection_params: Auth0Management.Organizations.CreateOrganizationConnectionsParams[] =
    passwordless_connections.map((connection) => ({
      connection_id: connection.id,
      assign_membership_on_login: true,
      show_as_button: true,
    }));

  const auth0_org = await auth0.Organizations.createOrganization({
    ...auth0_params,
    enabled_connections: enabled_connection_params,
  });

  const db_tenant = await createTenant({
    name: auth0_org.display_name,
    authId: auth0_org.id,
    securityLevel: securityLevel,
  });

  return db_tenant;
};
