import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import { postTenantSchema } from "../../shared/integrations/tenant";
import { selectTenantSchema } from "../../db/schema/tenant";
import { errorSchema } from "../../lib/utils/routingUtils";
import { postTenant } from "../../lib/integrations/tenant";

extendZodWithOpenApi(z);

export const tenantRoutes = new Hono().post(
  "/create",
  describeRoute({
    summary: "Create Tenant",
    description: "Creates a new tenant in Auth0 and the database.",
    tags: ["Tenants"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(postTenantSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Tenant created successfully",
        content: {
          "application/json": {
            schema: resolver(
              z.object({ tenant: selectTenantSchema }).openapi({
                title: "CreateTenantResponse",
                description: "Response schema for creating a tenant",
              })
            ),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(errorSchema),
          },
        },
      },
    },
  }),
  zValidator("json", postTenantSchema),
  async (c) => {
    const organization_params = c.req.valid("json");
    const organization = await postTenant(organization_params);
    return c.json({ organization }, 200);
  }
);
