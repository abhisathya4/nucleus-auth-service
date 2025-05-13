import { describe, test, expect, afterAll } from "bun:test";
import { harness } from "../../../bun.test";
import { v4 as uuidv4 } from "uuid";
import { tenant, selectTenantSchema } from "../../../../db/schema/tenant";
import {
  createTenant,
  getTenantFromId,
} from "../../../../db/queries/tables/tenant";
import type { z } from "zod";
import { inArray } from "drizzle-orm";

describe("Tenant Tests", () => {
  // Store tenants for cleanup
  const insertedTenants: z.infer<typeof selectTenantSchema>[] = [];

  afterAll(async () => {
    // Delete all inserted tenants
    await harness.db.db.delete(tenant).where(
      inArray(
        tenant.id,
        insertedTenants.map((t) => t.id)
      )
    );
  });

  describe("Test createTenant", () => {
    test("should create an tenant", async () => {
      const result = await createTenant({
        authId: `auth0|${uuidv4()}`,
        name: "test-tenant-1",
        securityLevel: "RLS",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("test-tenant-1");
      expect(result.securityLevel).toBe("RLS");

      insertedTenants.push(result);
    });

    test("should fail to create an tenant with invalid parameters", async () => {
      expect(
        // @ts-ignore
        createTenant({
          authId: `auth0|${uuidv4()}`,
          // Missing name
          securityLevel: "RLS",
        })
      ).rejects.toThrow();

      expect(
        // @ts-ignore
        createTenant({
          // Missing authId
          name: "test-tenant-2",
          securityLevel: "RLS",
        })
      ).rejects.toThrow();

      expect(
        createTenant({
          authId: `auth0|${uuidv4()}`,
          name: "test-tenant-2",
          // Invalid securityLevel
          // @ts-ignore
          securityLevel: "INVALID",
        })
      ).rejects.toThrow();
    });

    test("should fail to create an tenant with duplicate auth id", async () => {
      expect(
        createTenant({
          authId: insertedTenants[0]!.authId,
          name: "test-tenant-2",
          securityLevel: "RLS",
        })
      ).rejects.toThrow();
    });
  });

  describe("Test getTenantFromId", () => {
    test("should return tenant for existing id", async () => {
      const result = await createTenant({
        authId: `auth0|${uuidv4()}`,
        name: "test-tenant-2",
        securityLevel: "RLS",
      });

      insertedTenants.push(result);

      const fetchedTenant = await getTenantFromId(result.id);
      expect(fetchedTenant).toBeDefined();
      expect(fetchedTenant.id).toBe(result.id);
      expect(fetchedTenant.name).toBe("test-tenant-2");
    });

    test("should throw error for non-existent tenant", async () => {
      expect(getTenantFromId(uuidv4())).rejects.toThrow("Tenant not created");
    });
  });
});
