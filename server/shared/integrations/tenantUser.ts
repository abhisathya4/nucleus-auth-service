import { createTenantUserSchema } from "../../db/queries/tables/tenantUser";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";

extendZodWithOpenApi(z);

// Base tenant user schema from the database
const baseTenantUserSchema = createTenantUserSchema.omit({ authId: true });

// Auth0 tenant user creation schema with all fields from CreateUserParams
export const postTenantUserSchema = baseTenantUserSchema
  .extend({
    // Optional fields
    email_verified: z.boolean().optional().openapi({
      description: "Whether the user's email is verified",
      example: false,
    }),
    phone_verified: z.boolean().optional().openapi({
      description: "Whether the user's phone is verified",
      example: false,
    }),
    user_metadata: z
      .record(z.any())
      .optional()
      .openapi({
        description: "Custom user metadata that can be read by the user",
        example: { preferred_contact_method: "email" },
      }),
    app_metadata: z
      .record(z.any())
      .optional()
      .openapi({
        description:
          "Custom user metadata that can only be read by the application",
        example: { roles: ["admin"] },
      }),
    blocked: z.boolean().optional().openapi({
      description: "Whether the user is blocked",
      example: false,
    }),
    given_name: z.string().optional().openapi({
      description: "User's given name",
      example: "John",
    }),
    family_name: z.string().optional().openapi({
      description: "User's family name",
      example: "Doe",
    }),
    nickname: z.string().optional().openapi({
      description: "User's nickname",
      example: "Johnny",
    }),
    picture: z.string().optional().openapi({
      description: "URL to the user's profile picture",
      example: "https://example.com/profile.jpg",
    }),
    phone_number: z.string().optional().openapi({
      description: "User's phone number (E.164 format)",
      example: "+15551234567",
    }),
    password: z.string().optional().openapi({
      description: "User's password (only for database connections)",
      example: "StrongP@ssw0rd!",
    }),
    verify_email: z.boolean().optional().openapi({
      description: "Whether to verify the user's email",
      example: true,
    }),
    user_id: z.string().optional().openapi({
      description:
        "The user_id prefix. Can only be used for database connections and with the Auth0 Management API.",
      example: "auth0|user123",
    }),
    username: z.string().optional().openapi({
      description: "User's username (only for database connections)",
      example: "johndoe",
    }),
  })
  .openapi({
    title: "Create Tenant User",
    description: "Schema for creating a tenant user in Auth0 and the database",
  });
