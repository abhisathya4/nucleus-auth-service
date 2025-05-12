import { z } from "zod";
import { postTenantSchema } from "../integrations/tenant";
import { postTenantUserSchema } from "../integrations/tenantUser";
import { extendZodWithOpenApi } from "zod-openapi";
import { selectTenantUserSchema } from "../../db/schema/tenantUser";
import { selectTenantSchema } from "../../db/schema/tenant";

extendZodWithOpenApi(z);

export const createNewUserSchema = z
  .object({
    tenant: postTenantSchema.openapi({
      title: "Create Tenant",
      description: "Schema for creating a tenant after inserting into Auth0",
    }),
    user: postTenantUserSchema
      .omit({
        tenantId: true,
        email_verified: true,
        phone_verified: true,
        verify_email: true,
        user_id: true,
      })
      .openapi({
        title: "Create User",
        description: "Schema for creating a new user in Auth0",
      }),
  })
  .openapi({
    title: "Create New User",
    description: "Schema for creating a new user and organization in Auth0",
  });

export const createNewUserResponseSchema = z
  .object({
    tenant: selectTenantSchema,
    user: selectTenantUserSchema,
  })
  .openapi({
    title: "CreateOrganizationAndAdminUserResponse",
    description:
      "Response schema for creating an organization and inviting an admin user",
  });
