import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import env from "../../lib/config/env";
import { eq, getTableColumns, getTableName, inArray, sql } from "drizzle-orm";
import { join } from "path";
import type { z } from "zod";
import { tenant, type selectTenantSchema } from "../../db/schema/tenant";
import { tenantUser, selectTenantUserSchema } from "../../db/schema/tenantUser";
import { PgColumn, type PgTable } from "drizzle-orm/pg-core";

/**
 * TestDatabaseClient sets up a Drizzle/Neon connection and provides
 * utilities for test data management.
 */
export class TestDatabaseClient {
  /**
   * List of tables used in the test database
   */
  private tables: PgTable[] = [
    // Tenant
    tenantUser,
    tenant,
  ];

  private pk_columns: Record<string, PgColumn[]> = {
    // Tenant
    tenantUser: [tenantUser.id],
    tenant: [tenant.id],
  };

  private tableName_map: Record<string, PgTable> = {};

  /**
   * Constructs a new TestDatabaseClient instance.
   * @param db Drizzle/Neon connection instance
   */
  private constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
    if (this.tables.length != 14) {
      throw new Error("Tables array is not initialized correctly");
    }

    this.tables.forEach((table) => {
      this.tableName_map[getTableName(table)] = table;
    });
  }

  private async deleteByPrimaryKeys<T extends PgTable>(
    table: T,
    tableName: string,
    pkColumns: PgColumn[],
    rows: Record<string, any>[]
  ) {
    if (rows.length === 0) return;

    const columnNameToJSKey = Object.entries(getTableColumns(table)).reduce(
      (acc, [jsKey, column]) => {
        if (pkColumns.includes(column)) {
          acc[column.name] = jsKey;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const columnTupleSQL = sql.join(
      pkColumns.map((col) => sql.identifier(col.name)),
      sql`, `
    );

    const valueTuples = rows.map((row) => {
      const tupleValues = pkColumns.map((col) => {
        const jsKey = columnNameToJSKey[col.name];
        if (!jsKey) throw new Error(`Missing JS key for column ${col.name}`);
        return sql.param(row[jsKey]);
      });
      return sql`(${sql.join(tupleValues, sql`, `)})`;
    });

    const query = sql`
    DELETE FROM ${sql.identifier(tableName)}
    WHERE (${columnTupleSQL}) IN (${sql.join(valueTuples, sql`, `)})
  `;

    await this.db.execute(query);
    // console.log(query.getSQL());
  }

  /**
   * Database connection instance
   */
  public readonly db: ReturnType<typeof drizzle>;

  /**
   * Public handle to manage test organizations
   */
  public Tenant!: InstanceType<typeof TestDatabaseClient.Tenant>;

  /**
   * Public handle to manage test tenant users
   */
  public TenantUser!: InstanceType<typeof TestDatabaseClient.User>;

  /**
   * Initializes a TestDatabaseClient with a PostgreSQL connection and attaches managers.
   * @returns A Promise resolving to a TestDatabaseClient instance.
   */
  public static async init(): Promise<TestDatabaseClient> {
    const connectionString = env.DATABASE_URL;
    const pgClient = postgres(connectionString);
    const drizzleDb = drizzle(pgClient);
    const client = new TestDatabaseClient(drizzleDb);
    client.Tenant = await TestDatabaseClient.Tenant.init(client);
    client.TenantUser = await TestDatabaseClient.User.init(client);
    return client;
  }

  /**
   * Reads and executes a raw SQL file.
   * @param relativePath - File path relative to this file's directory.
   * @throws If file read or SQL execution fails.
   */
  private async executeSqlFromFile(relativePath: string): Promise<void> {
    const absolutePath = join(import.meta.dir, relativePath);
    const query = await Bun.file(absolutePath).text();
    await this.db.execute(sql.raw(query));
  }

  /**
   * Cleans up the test database by truncating all tables using the provided SQL script.
   * @param sqlFilePath - Path to the truncate script relative to this file.
   */
  public async cleanup(
    sqlFilePath = "queries/truncate_tables.sql"
  ): Promise<void> {
    await this.executeSqlFromFile(sqlFilePath);
  }

  /**
   * Seeds the database with data for test cases. It executes the query as neondb_owner.
   * @param table - The table to seed.
   * @param dataFile - The file containing the data to seed.
   * @returns The result of the seed operation.
   */
  public async seedTableFromFile(
    table: PgTable,
    dataFile: string,
    tenant: boolean = true
  ): Promise<any[]> {
    try {
      // Construct the absolute path to the data file
      const absolutePath = join(import.meta.dir, "../data", dataFile);

      // Read the data file
      const data = await Bun.file(absolutePath).text();

      // Parse the data as an array
      let dataArray = JSON.parse(data) as any[];

      if (tenant) {
        const tenantId = this.Tenant.id;
        dataArray = dataArray.map((row) => ({
          ...row,
          tenantId,
        }));
      }

      // Execute the raw query with the data array
      const result = await this.db.insert(table).values(dataArray).returning();

      console.log(
        `Table: ${getTableName(table)} seeded successfully using ${dataFile}`
      );

      return result;
    } catch (error: any) {
      console.error("Failed to seed database:", error);
      throw new Error(`Database seeding failed: ${error.message}`);
    }
  }

  /**
   * Seeds the database with data for test cases. It executes the query as neondb_owner.
   * @param table - The table to seed.
   * @param dataFile - The file containing the data to seed.
   * @returns The result of the seed operation.
   */
  public async seedTable(
    table: PgTable,
    tableData: any[],
    tenant: boolean = true
  ): Promise<any[]> {
    try {
      if (tenant) {
        const tenantId = this.Tenant.id;
        tableData = tableData.map((row) => ({
          ...row,
          tenantId,
        }));
      }

      // Execute the raw query with the data array
      const result = await this.db.insert(table).values(tableData).returning();

      console.log(`Table: ${getTableName(table)} seeded successfully`);

      return result;
    } catch (error: any) {
      console.error("Failed to seed database:", error);
      throw new Error(`Database seeding failed: ${error.message}`);
    }
  }

  public async seedSituation(dataFile: string, tenant: boolean = true) {
    try {
      // Construct the absolute path to the data file
      const absolutePath = join(
        import.meta.dir,
        "../data/situations",
        dataFile
      );

      // Read the data file
      const data = await Bun.file(absolutePath).text();

      // Parse the data as an array
      let seedData = JSON.parse(data) as Record<string, any[]>;

      const tables = Object.keys(seedData);

      const seededData: Record<string, any[]> = {};

      for (const tableName of tables) {
        const tableData = seedData[tableName];
        if (!tableData) {
          throw new Error(`Table ${tableName} not found in seed data`);
        }
        const table = this.tableName_map[tableName];
        if (!table) {
          throw new Error(`Table ${tableName} not found in schema`);
        }
        seededData[tableName] = await this.seedTable(table, tableData, tenant);
      }

      console.log(`Situation: ${dataFile} seeded successfully`);

      return seededData;
    } catch (error: any) {
      console.error("Failed to seed database:", error);
      throw new Error(`Database seeding failed: ${error.message}`);
    }
  }

  public async cleanupSeededSituation(seededData: Record<string, any[]>) {
    for (const tableName of Object.keys(seededData).reverse()) {
      try {
        const table = this.tableName_map[tableName as keyof typeof seededData];
        if (!table) {
          throw new Error(`Table ${tableName} not found in schema`);
        }
        const pkColumn = this.pk_columns[tableName as keyof typeof seededData];
        if (!pkColumn) {
          throw new Error(`Primary key column for ${tableName} not found`);
        }
        const rows = seededData[tableName as keyof typeof seededData];
        if (!rows) {
          throw new Error(`No rows found for table ${tableName}`);
        }
        await this.deleteByPrimaryKeys(table, tableName, pkColumn, rows);
        console.log(`Table: ${tableName} cleaned up successfully`);
      } catch (error: any) {
        console.error(`Failed to clean up table ${tableName}:`, error);
        throw new Error(
          `Failed to clean up table ${tableName}: ${error.message}`
        );
      }
    }
    console.log(`Situation tables cleaned up successfully`);
  }

  /**
   * Truncates the specified table.
   * @param table - The table to truncate.
   */
  public async truncateTable(table: PgTable) {
    try {
      await this.db.delete(table);
      console.log(`Table: ${getTableName(table)} truncated successfully`);
    } catch (error: any) {
      console.error("Failed to truncate table:", error);
      throw new Error(`Table truncation failed: ${error.message}`);
    }
  }

  /**
   * Static class for managing test organization lifecycle in the database.
   * Provides functionality to create and delete a test organization for isolation in integration tests.
   */
  static Tenant = class TenantManager {
    private testTenantId: string | null = null;

    /**
     * Constructs a new TenantManager instance.
     * @param client - The parent TestDatabaseClient instance.
     */
    constructor(private client: TestDatabaseClient) {}

    /**
     * Instantiates the TenantManager utility.
     * @param client - An initialized TestDatabaseClient instance.
     * @returns A Promise resolving to the TenantManager.
     */
    public static async init(
      client: TestDatabaseClient
    ): Promise<InstanceType<typeof TestDatabaseClient.Tenant>> {
      return new TestDatabaseClient.Tenant(client);
    }

    /**
     * Creates a test organization row in the database.
     * @param authId - The Auth ID to associate with the test organization.
     * @returns A validated and parsed organization row.
     */
    public async createTestTenant(
      authId: string
    ): Promise<z.infer<typeof selectTenantSchema>> {
      const [org] = await this.client.db
        .insert(tenant)
        .values({
          authId,
          name: "test-tenant",
          securityLevel: "RLS",
        })
        .returning();

      if (!org) throw new Error("Failed to create test tenant");
      this.testTenantId = org.id;
      return org;
    }

    /**
     * Deletes the test organization previously created.
     */
    public async deleteTestTenant(): Promise<void> {
      if (!this.testTenantId) return;
      await this.client.db
        .delete(tenant)
        .where(eq(tenant.id, this.testTenantId));
      this.testTenantId = null;
    }

    /**
     * Gets the ID of the created test organization, if it exists.
     */
    public get id(): string {
      if (!this.testTenantId) {
        throw new Error("Test organization not created");
      }
      return this.testTenantId;
    }
  };

  /**
   * Static class for managing test tenant user lifecycle in the database.
   * Supports creation and deletion of an tenant user tied to an organization.
   */
  static User = class UserManager {
    private testUserId: string | null = null;

    /**
     * Constructs a new UserManager instance.
     * @param client - The parent TestDatabaseClient instance.
     */
    constructor(private client: TestDatabaseClient) {}

    /**
     * Instantiates the UserManager utility.
     * @param client - An initialized TestDatabaseClient instance.
     * @returns A Promise resolving to the UserManager.
     */
    public static async init(
      client: TestDatabaseClient
    ): Promise<InstanceType<typeof TestDatabaseClient.User>> {
      return new TestDatabaseClient.User(client);
    }

    /**
     * Creates a test tenant user.
     * @param authId - The Auth ID to associate with the user.
     * @returns The parsed tenant user record.
     */
    public async createTestTenantUser(
      authId: string
    ): Promise<z.infer<typeof selectTenantUserSchema>> {
      if (!this.client.Tenant.id) {
        throw new Error("Tenant ID not set - create tenant first");
      }
      const tenantId = this.client.Tenant.id;
      const [user] = await this.client.db
        .insert(tenantUser)
        .values({
          authId,
          tenantId,
          email: "testuser@example.com",
          name: "Test User",
        })
        .returning();

      if (!user) throw new Error("Failed to create test tenant user");
      const parsed = selectTenantUserSchema.parse(user);
      this.testUserId = parsed.id;
      return parsed;
    }

    /**
     * Deletes the test tenant user previously created.
     */
    public async deleteTestTenantUser(): Promise<void> {
      if (!this.testUserId) return;
      await this.client.db
        .delete(tenantUser)
        .where(eq(tenantUser.id, this.testUserId));
      this.testUserId = null;
    }

    /**
     * Gets the ID of the created test user, if it exists.
     */
    public get id(): string | null {
      return this.testUserId;
    }
  };
}
