import { z } from "zod";
import type { Context } from "hono";

// Error schema
export const errorSchema = z
  .object({
    error: z.string().describe("Error message"),
  })
  .describe("Error return type");
