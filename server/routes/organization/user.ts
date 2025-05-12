import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import { createNewUserFlow } from "../../lib/flows/createNewUserFlow";
import {
  createNewUserResponseSchema,
  createNewUserSchema,
} from "../../shared/flows/newUser";
import { errorSchema } from "../../lib/utils/routingUtils";

extendZodWithOpenApi(z);

export const registrationRoutes = new Hono().post(
  "/register",
  describeRoute({
    summary: "Register New Tenant and Tenant User",
    description:
      "Creates a new tenant in Auth0 and the database, and creates a tenant user.",
    tags: ["Tenants", "Users"],
    requestBody: {
      content: {
        "application/json": {
          schema: resolver(createNewUserSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Tenant and tenant user created successfully",
        content: {
          "application/json": {
            schema: resolver(createNewUserResponseSchema),
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
  zValidator("json", createNewUserSchema),
  async (c) => {
    const params = c.req.valid("json");
    const { tenant, user } = await createNewUserFlow(params);
    return c.json({ tenant, user: user.db_tenantUser }, 200);
  }
);
