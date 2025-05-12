import type { z } from "zod";
import type { selectTenantSchema } from "../../db/schema/tenant";
import type { Auth0Management } from "../../lib/apis/auth0/Auth0Management";
import { TestUserAuth } from "./auth";
import { TestAuth0Mgmt } from "./auth0";
import { TestDatabaseClient } from "./database";
import type { selectTenantUserSchema } from "../../db/schema/tenantUser";
import env from "../../lib/config/env";

/**
 * TestHarness coordinates test setup and teardown across Auth0 and the test database.
 */
export class TestHarness {
  private database!: TestDatabaseClient;
  private auth0!: TestAuth0Mgmt;
  private userAuth: TestUserAuth | null = null;
  private testUsersCreated: boolean = false;
  private auth0Org: Auth0Management.Organizations.Organization | null = null;
  private dbTenant: z.infer<typeof selectTenantSchema> | null = null;
  private auth0User: Auth0Management.Users.User | null = null;
  private dbTenantUser: z.infer<typeof selectTenantUserSchema> | null = null;

  /**
   * Initializes the test environment, including database and Auth0 clients.
   */
  public static async init(): Promise<TestHarness> {
    const harness = new TestHarness();
    harness.database = await TestDatabaseClient.init();
    harness.auth0 = await TestAuth0Mgmt.init();
    // Cleanup any previous data
    await harness.globalTeardown();
    return harness;
  }

  public async initUserAuth() {
    if (this.testUsersCreated) {
      this.userAuth = await TestUserAuth.init(this.auth0);
    } else {
      throw new Error("Test users have not been created yet");
    }
  }

  /**
   * Creates a test tenant in Auth0 and DB, and a test user in both.
   * Returns references to all created test entities.
   */
  public async createTestTenantAndUser() {
    if (this.testUsersCreated) {
      return {
        auth0Organization: this.auth0Org!,
        databaseOrganization: this.dbTenant!,
        auth0User: this.auth0User!,
        databaseTenantUser: this.dbTenantUser!,
      };
    }

    const auth0Org = await this.auth0.Organization.createTestOrganization();
    const dbTenant = await this.database.Tenant.createTestTenant(auth0Org.id);
    const auth0User = await this.auth0.User.createTestUser();
    const dbTenantUser = await this.database.TenantUser.createTestTenantUser(
      auth0User.user_id
    );
    await this.auth0.Organization.addTestUserToTestOrganization(
      auth0User.user_id
    );

    this.testUsersCreated = true;
    this.auth0Org = auth0Org;
    this.dbTenant = dbTenant;
    this.auth0User = auth0User;
    this.dbTenantUser = dbTenantUser;
    await this.initUserAuth();

    return {
      auth0Organization: auth0Org,
      databaseOrganization: dbTenant,
      auth0User,
      databaseTenantUser: dbTenantUser,
    };
  }

  /**
   * Resets the state of the harness.
   */
  private resetState() {
    this.testUsersCreated = false;
    this.auth0Org = null;
    this.dbTenant = null;
    this.auth0User = null;
    this.dbTenantUser = null;
  }

  /**
   * Deletes all test users and tenants from Auth0 and database.
   */
  public async deleteTestTenantAndUser(): Promise<void> {
    await this.auth0.User.deleteAllTestUsers();
    await this.database.TenantUser.deleteTestTenantUser();
    await this.auth0.Organization.deleteAllTestOrganizations();
    await this.database.Tenant.deleteTestTenant();
    this.userAuth?.reset();
    this.resetState();
  }

  /**
   * Truncates all database tables and removes all Auth0 test data.
   */
  public async cleanupAll(): Promise<void> {
    await this.auth0.cleanupAll();
    await this.database.cleanup();
    this.resetState();
    this.userAuth?.reset();
  }

  /**
   * Global test setup hook.
   * Initializes all test resources.
   */
  public static async globalSetup(): Promise<TestHarness> {
    console.log("Test Harness Setup: Auth0 Domain: ", env.AUTH0_DOMAIN);
    const harness = await TestHarness.init();
    await harness.createTestTenantAndUser();
    return harness;
  }

  /**
   * Global teardown hook.
   * Cleans up all test data from Auth0 and database.
   */
  public async globalTeardown(): Promise<void> {
    await this.deleteTestTenantAndUser();
    await this.cleanupAll();
  }

  /**
   * Returns the underlying database instance.
   */
  public get db(): TestDatabaseClient {
    if (!this.database) {
      throw new Error("Database client not initialized");
    }
    return this.database;
  }

  /**
   * Returns the Auth0 management client.
   */
  public get auth(): TestAuth0Mgmt {
    return this.auth0;
  }

  /**
   * Returns the user authentication client.
   */
  public get user(): TestUserAuth {
    if (!this.userAuth) {
      throw new Error("User authentication client not initialized");
    }
    return this.userAuth;
  }
}
