import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import { securityLevel } from "../../db/schema/tenant";

extendZodWithOpenApi(z);

// Define the branding colors schema
export const brandingColorsSchema = z
  .object({
    primary: z.string().optional().openapi({
      description: "Primary color for tenant branding",
      example: "#FF0000",
    }),
    page_background: z.string().optional().openapi({
      description: "Page background color for tenant branding",
      example: "#FFFFFF",
    }),
  })
  .openapi({
    title: "Tenant Branding Colors",
    description: "Color scheme for tenant branding",
  });

// Define the branding schema
export const brandingSchema = z
  .object({
    logo_url: z.string().url().optional().openapi({
      description: "URL to the tenant's logo",
      example: "https://example.com/logo.png",
    }),
    colors: brandingColorsSchema.optional(),
  })
  .openapi({
    title: "Tenant Branding",
    description: "Branding information for the tenant",
  });

// Define the metadata schema as a record of any values
export const metadataSchema = z.record(z.any()).optional().openapi({
  title: "Tenant Metadata",
  description: "Additional metadata for the tenant",
});

// Define the CreateTenantParams schema
export const postTenantSchema = z
  .object({
    name: z.string().openapi({
      description: "Unique name for the tenant (used as identifier)",
      example: "acme-inc",
    }),
    display_name: z.string().openapi({
      description: "Display name for the tenant",
      example: "Acme Inc.",
    }),
    branding: brandingSchema.optional(),
    metadata: metadataSchema,
    securityLevel: z.enum(securityLevel.enumValues).openapi({
      description: "Security level for the tenant",
      example: "RLS",
      default: "RLS",
    }),
  })
  .openapi({
    title: "Create Tenant Parameters",
    description:
      "Parameters for creating a new tenant in Auth0 with additional security level",
    required: ["name", "display_name", "securityLevel"],
  });
