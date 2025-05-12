import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import { getTenantUsersForTenant } from "../../db/queries/tables/organization/tenantUser";
import { getUserRLSToken } from "../../lib/middleware/rls/userRLS";
import { errorSchema } from "../../lib/utils/routingUtils";
import { getAuthUser } from "../../lib/middleware/auth/auth0";
import { selectTenantUserSchema } from "../../db/schema/tenantUser";
import type { AuthUser } from "../../lib/middleware/models/AuthUser";

extendZodWithOpenApi(z);

export const tenantUserRoutes = new Hono().get(
  "/",
  getAuthUser,
  describeRoute({
    summary: "Get Tenant Users",
    description:
      "Retrieves all users for the current tenant based on user's RLS token.",
    tags: ["Tenant Users"],
    responses: {
      200: {
        description: "List of users retrieved successfully",
        content: {
          "application/json": {
            schema: resolver(selectTenantUserSchema.array()),
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: resolver(errorSchema),
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
  async (c) => {
    try {
      const user = c.get("user") as AuthUser;
      const users = await getTenantUsersForTenant(user.organizationId);
      return c.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return c.json({ error: "Failed to retrieve users" }, 500);
    }
  }
);
