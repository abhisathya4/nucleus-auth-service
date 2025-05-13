import { describe, test, expect, afterAll, beforeAll } from "bun:test";
import { harness } from "../../../bun.test";
import { v4 as uuidv4 } from "uuid";
import {
  tenantUser,
  selectTenantUserSchema,
} from "../../../../db/schema/tenantUser";
import {
  createTenantUser,
  getTenantUserFromAuthId,
  getTenantUserFromEmail,
  updateTenantUserAuthId,
  getTenantUsersForTenant,
} from "../../../../db/queries/tables/tenantUser";
import type { z } from "zod";
import { inArray } from "drizzle-orm";

describe("Tenant User Tests", () => {
  // Store tenant users for cleanup
  const insertedTenantUsers: z.infer<typeof selectTenantUserSchema>[] = [];

  // We'll use the tenant created by the test harness
  let tenantId: string;

  beforeAll(() => {
    // Get the tenant ID from the test harness
    tenantId = harness.db.Tenant.id;
  });

  afterAll(async () => {
    // Delete all inserted admins
    await harness.db.db.delete(tenantUser).where(
      inArray(
        tenantUser.id,
        insertedTenantUsers.map((a) => a.id)
      )
    );
  });

  describe("Test createTenantUser", () => {
    test("should create a tenant user", async () => {
      const authId = `auth0|${uuidv4()}`;
      const result = await createTenantUser({
        authId,
        tenantId,
        email: "test-user-1@example.com",
        name: "Test User 1",
      });

      expect(result).toBeArrayOfSize(1);
      expect(result[0]!.email).toBe("test-user-1@example.com");
      expect(result[0]!.name).toBe("Test User 1");

      insertedTenantUsers.push(result[0]!);
    });

    test("should fail to create a tenant user with invalid parameters", async () => {
      expect(
        // @ts-ignore
        createTenantUser({
          authId: `auth0|${uuidv4()}`,
          tenantId,
          // Missing email
          name: "Test User 2",
        })
      ).rejects.toThrow();

      expect(
        // @ts-ignore
        createTenantUser({
          authId: `auth0|${uuidv4()}`,
          // Missing organizationId
          email: "test-admin-2@example.com",
          name: "Test Admin 2",
        })
      ).rejects.toThrow();
    });

    test("should fail to create a tenant user with invalid tenant ID", async () => {
      expect(
        createTenantUser({
          authId: `auth0|${uuidv4()}`,
          tenantId: uuidv4(), // Non-existent tenant ID
          email: "test-user-2@example.com",
          name: "Test User 2",
        })
      ).rejects.toThrow();
    });

    test("should fail to create a tenant user with duplicate auth ID", async () => {
      expect(
        createTenantUser({
          authId: insertedTenantUsers[0]!.authId,
          tenantId,
          email: "test-user-2@example.com",
          name: "Test Admin 2",
        })
      ).rejects.toThrow();
    });

    test("should fail to create an admin with duplicate email", async () => {
      expect(
        createTenantUser({
          authId: `auth0|${uuidv4()}`,
          tenantId: tenantId,
          email: insertedTenantUsers[0]!.email,
          name: "Test Admin 2",
        })
      ).rejects.toThrow();
    });
  });

  describe("Test getTenantUserFromAuthId", () => {
    test("should return tenant user for existing auth ID", async () => {
      const authId = `auth0|${uuidv4()}`;
      const result = await createTenantUser({
        authId,
        tenantId,
        email: "test-user-3@example.com",
        name: "Test User 3",
      });

      insertedTenantUsers.push(result[0]!);

      const fetchedTenantUser = await getTenantUserFromAuthId(authId);
      expect(fetchedTenantUser).toBeDefined();
      expect(fetchedTenantUser.authId).toBe(authId);
      expect(fetchedTenantUser.email).toBe("test-user-3@example.com");
    });

    test("should throw error for non-existent auth ID", async () => {
      expect(getTenantUserFromAuthId(`auth0|${uuidv4()}`)).rejects.toThrow(
        "Tenant User not found"
      );
    });
  });

  describe("Test getTenantUserFromEmail", () => {
    test("should return tenant user for existing email", async () => {
      const email = "test-user-4@example.com";
      const result = await createTenantUser({
        authId: `auth0|${uuidv4()}`,
        tenantId,
        email,
        name: "Test User 4",
      });

      insertedTenantUsers.push(result[0]!);

      const fetchedTenantUser = await getTenantUserFromEmail(email);
      expect(fetchedTenantUser).toBeDefined();
      expect(fetchedTenantUser.email).toBe(email);
      expect(fetchedTenantUser.name).toBe("Test User 4");
    });

    test("should throw error for non-existent email", async () => {
      expect(getTenantUserFromEmail("nonexistent@example.com")).rejects.toThrow(
        "Tenant User not found"
      );
    });
  });

  describe("Test updateTenantUserAuthId", () => {
    test("should update tenant user auth ID", async () => {
      // Create a tenant user
      const initialAuthId = `auth0|${uuidv4()}`;
      const result = await createTenantUser({
        authId: initialAuthId,
        tenantId,
        email: "test-user-5@example.com",
        name: "Test User 5",
      });

      insertedTenantUsers.push(result[0]!);

      // Update the auth ID
      const newAuthId = `auth0|${uuidv4()}`;
      const updateResult = await updateTenantUserAuthId(
        result[0]!.id,
        newAuthId
      );

      expect(updateResult).toBeArrayOfSize(1);
      expect(updateResult[0]!.authId).toBe(newAuthId);

      // Verify the update
      const fetchedAdmin = await getTenantUserFromAuthId(newAuthId);
      expect(fetchedAdmin).toBeDefined();
      expect(fetchedAdmin.authId).toBe(newAuthId);
    });

    test("should return empty array for non-existent admin ID", async () => {
      const result = await updateTenantUserAuthId(
        uuidv4(),
        `auth0|${uuidv4()}`
      );
      expect(result).toBeArrayOfSize(0);
    });
  });

  describe("Test getTenantUsersForTenant", () => {
    test("should return tenant users for a tenant", async () => {
      // Create multiple tenant users for the same tenant
      const authId1 = `auth0|${uuidv4()}`;
      const result1 = await createTenantUser({
        authId: authId1,
        tenantId,
        email: "test-user-6@example.com",
        name: "Test User 6",
      });

      const authId2 = `auth0|${uuidv4()}`;
      const result2 = await createTenantUser({
        authId: authId2,
        tenantId,
        email: "test-user-7@example.com",
        name: "Test User 7",
      });

      insertedTenantUsers.push(result1[0]!, result2[0]!);

      // Get tenant users for the tenant
      const tenantUsers = await getTenantUsersForTenant(tenantId);

      // Should return at least the two tenant users we just created
      expect(tenantUsers.length).toBeGreaterThanOrEqual(2);

      // Verify our tenant users are in the result
      const emails = tenantUsers.map((a) => a.email);
      expect(emails).toContain("test-user-6@example.com");
      expect(emails).toContain("test-user-7@example.com");
    });

    test("should return empty array for non-existent tenant ID", async () => {
      const result = await getTenantUsersForTenant(uuidv4());
      expect(result).toBeArrayOfSize(0);
    });
  });
});
