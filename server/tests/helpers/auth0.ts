/**
 * A management client for Auth0's Management API, intended for end-to-end testing workflows.
 *
 * Features:
 * - Obtain and cache a client-credentials access token
 * - Create, list, delete, and manage test users and organizations
 * - List and delete all users and organizations for cleanup
 */
import axios from "axios";
import type { Auth0Management } from "../../lib/apis/auth0/Auth0Management";
import env from "../../lib/config/env";
import { handleError } from "../../lib/utils/axiosUtils";

const DOMAIN = env.AUTH0_MANAGEMENT_DOMAIN!;
const CLIENT_ID = env.AUTH0_MANAGEMENT_CLIENT_ID!;
const CLIENT_SECRET = env.AUTH0_MANAGEMENT_CLIENT_SECRET!;
const AUDIENCE = `https://${DOMAIN}/api/v2/`;

export class TestAuth0Mgmt {
  private accessToken: string | null = null;

  public User!: InstanceType<typeof TestAuth0Mgmt.UserManager>;
  public Connections!: InstanceType<typeof TestAuth0Mgmt.ConnectionManager>;
  public Organization!: InstanceType<typeof TestAuth0Mgmt.OrganizationManager>;

  /**
   * Initialize the TestAuth0Mgmt client and its managers.
   * @returns A fully initialized client with User, Connections, and Organization managers.
   */
  public static async init(): Promise<TestAuth0Mgmt> {
    const client = new TestAuth0Mgmt();
    client.User = await TestAuth0Mgmt.UserManager.init(client);
    client.Connections = await TestAuth0Mgmt.ConnectionManager.init(client);
    const upConn = await client.Connections.getUsernamePasswordConnection();
    client.Organization = await TestAuth0Mgmt.OrganizationManager.init(
      client,
      upConn
    );
    return client;
  }

  /**
   * Fetches and caches a Management API access token using client-credentials grant.
   * @returns A valid access token string.
   * @throws Error if the token request fails.
   */
  public async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await axios.post<Auth0Management.TokenResponse>(
        `https://${DOMAIN}/oauth/token`,
        {
          audience: AUDIENCE,
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status !== 200) {
        throw new Error(`Auth0 token fetch failed: ${response.status}`);
      }

      this.accessToken = response.data.access_token;
      return this.accessToken!;
    } catch (err) {
      throw new Error(`Failed to fetch Auth0 token: ${err}`);
    }
  }

  /**
   * Deletes all organizations then all users in Auth0 for a clean test slate.
   */
  public async cleanupAll(): Promise<void> {
    await this.Organization.deleteAllTestOrganizations();
    await this.User.deleteAllTestUsers();
  }

  // --------------------------------------------------------------------------
  // UserManager: create, list, and delete test users
  // --------------------------------------------------------------------------

  static UserManager = class {
    private static readonly PER_PAGE = 50;
    private testUserData: Auth0Management.Users.CreateUserParams = {
      email: "testuser@example.com",
      user_metadata: {},
      blocked: false,
      app_metadata: {},
      given_name: "Test",
      family_name: "User",
      name: "Test User",
      nickname: "TestUser",
      connection: "Username-Password-Authentication",
      password: "5p2dXucvnC9/&0Ei",
      verify_email: false,
    };

    constructor(private parent: TestAuth0Mgmt) {}

    /**
     * Instantiate the UserManager.
     * @param parent The TestAuth0Mgmt client.
     */
    public static async init(
      parent: TestAuth0Mgmt
    ): Promise<InstanceType<typeof TestAuth0Mgmt.UserManager>> {
      return new TestAuth0Mgmt.UserManager(parent);
    }

    /**
     * Returns credentials for the test user.
     */
    public getTestUserCredentials(): { username: string; password: string } {
      if (!this.testUserData.email || !this.testUserData.password) {
        throw new Error("Test user credentials not initialized");
      }
      return {
        username: this.testUserData.email,
        password: this.testUserData.password,
      };
    }

    /**
     * Creates a test user in Auth0.
     * @returns The created user object.
     */
    public async createTestUser(): Promise<Auth0Management.Users.User> {
      try {
        const token = await this.parent.getAccessToken();
        const { data } = await axios.post<Auth0Management.Users.User>(
          `https://${DOMAIN}/api/v2/users`,
          this.testUserData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return data;
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Fetches a single page of users.
     * @param page Zero-based page index (default 0).
     * @param perPage Number of users per page (default PER_PAGE).
     * @returns Array of User objects.
     */
    public async listUsers(
      page = 0,
      perPage = TestAuth0Mgmt.UserManager.PER_PAGE
    ): Promise<Auth0Management.Users.User[]> {
      try {
        const token = await this.parent.getAccessToken();
        const { data } = await axios.get<Auth0Management.Users.User[]>(
          `https://${DOMAIN}/api/v2/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { per_page: perPage, page },
          }
        );
        return data;
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Fetches all users across all pages.
     * @returns Array of all User objects.
     */
    public async listAllUsers(): Promise<Auth0Management.Users.User[]> {
      const allUsers: Auth0Management.Users.User[] = [];
      let page = 0;
      while (true) {
        const users = await this.listUsers(page);
        if (users.length === 0) break;
        allUsers.push(...users);
        page++;
      }
      return allUsers;
    }

    /**
     * Deletes a single user by ID.
     * @param userId The Auth0 user ID to delete.
     */
    public async deleteUser(userId: string): Promise<void> {
      try {
        const token = await this.parent.getAccessToken();
        await axios.delete(`https://${DOMAIN}/api/v2/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Pages through all users and deletes each one.
     */
    public async deleteAllTestUsers(): Promise<void> {
      let page = 0;
      while (true) {
        const users = await this.listUsers(page);
        if (users.length === 0) break;
        for (const u of users) {
          const id = (u as any).user_id ?? (u as any).id;
          await this.deleteUser(id);
        }
        page++;
      }
    }
  };

  // --------------------------------------------------------------------------
  // ConnectionManager: list and cache Auth0 connections
  // --------------------------------------------------------------------------

  static ConnectionManager = class {
    private connections: Auth0Management.Connections.Connection[] = [];

    constructor(private parent: TestAuth0Mgmt) {}

    /**
     * Instantiate the ConnectionManager.
     */
    public static async init(
      parent: TestAuth0Mgmt
    ): Promise<InstanceType<typeof TestAuth0Mgmt.ConnectionManager>> {
      return new TestAuth0Mgmt.ConnectionManager(parent);
    }

    /**
     * Fetches all connections, cached unless refetch=true.
     * @param refetch Force a fresh request if true.
     */
    public async getConnections(
      refetch = false
    ): Promise<Auth0Management.Connections.Connection[]> {
      if (!refetch && this.connections.length) return this.connections;
      try {
        const token = await this.parent.getAccessToken();
        const { data } = await axios.get<
          Auth0Management.Connections.Connection[]
        >(`https://${DOMAIN}/api/v2/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.connections = data;
        return data;
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Finds the default username/password database connection.
     * @throws if none is named "Username-Password-Authentication".
     */
    public async getUsernamePasswordConnection(): Promise<Auth0Management.Connections.Connection> {
      const all = await this.getConnections();
      const found = all.find(
        (c) => c.name === "Username-Password-Authentication"
      );
      if (!found) throw new Error("Username-Password-Authentication not found");
      return found;
    }
  };

  // --------------------------------------------------------------------------
  // OrganizationManager: create, list, add members, and delete organizations
  // --------------------------------------------------------------------------

  static OrganizationManager = class {
    private testOrgData: Auth0Management.Organizations.CreateOrganizationParams;
    private organizationId: string | null = null;

    constructor(
      private parent: TestAuth0Mgmt,
      usernamePasswordConnection: Auth0Management.Connections.Connection
    ) {
      this.testOrgData = {
        name: "test-org",
        display_name: "Test Organization",
        branding: {
          logo_url: "https://example.com/logo.png",
          colors: { primary: "#000000", page_background: "#ffffff" },
        },
        enabled_connections: [
          {
            connection_id: usernamePasswordConnection.id,
            assign_membership_on_login: true,
            show_as_button: true,
          },
        ],
      };
    }

    /**
     * Instantiate the OrganizationManager.
     */
    public static async init(
      parent: TestAuth0Mgmt,
      upConn: Auth0Management.Connections.Connection
    ): Promise<InstanceType<typeof TestAuth0Mgmt.OrganizationManager>> {
      return new TestAuth0Mgmt.OrganizationManager(parent, upConn);
    }

    /**
     * Creates a test organization.
     * @returns The created organization.
     */
    public async createTestOrganization(): Promise<Auth0Management.Organizations.Organization> {
      try {
        const token = await this.parent.getAccessToken();
        const { data } =
          await axios.post<Auth0Management.Organizations.Organization>(
            `https://${DOMAIN}/api/v2/organizations`,
            this.testOrgData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        this.organizationId = data.id;
        return data;
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    public getTestOrganizationName(): string {
      return this.testOrgData.name;
    }

    /**
     * Fetches all organizations.
     * @returns Array of Organization objects.
     */
    public async listOrganizations(): Promise<
      Auth0Management.Organizations.Organization[]
    > {
      try {
        const token = await this.parent.getAccessToken();
        const { data } = await axios.get<
          Auth0Management.Organizations.Organization[]
        >(`https://${DOMAIN}/api/v2/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return data;
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Adds a user to the created organization.
     * Must call createTestOrganization() first.
     * @param userId Auth0 user ID
     */
    public async addTestUserToTestOrganization(userId: string): Promise<void> {
      if (!this.organizationId) {
        throw new Error(
          "Organization not created—call createTestOrganization() first."
        );
      }
      try {
        const token = await this.parent.getAccessToken();
        await axios.post(
          `https://${DOMAIN}/api/v2/organizations/${this.organizationId}/members`,
          { members: [userId] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Deletes a single organization by ID.
     * @param orgId The Auth0 organization ID to delete.
     */
    public async deleteOrganization(orgId: string): Promise<void> {
      try {
        const token = await this.parent.getAccessToken();
        await axios.delete(`https://${DOMAIN}/api/v2/organizations/${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        handleError(err);
        throw err;
      }
    }

    /**
     * Fetches and deletes all organizations.
     */
    public async deleteAllTestOrganizations(): Promise<void> {
      const orgs = await this.listOrganizations();
      for (const o of orgs) {
        await this.deleteOrganization(o.id);
      }
    }
  };
}
