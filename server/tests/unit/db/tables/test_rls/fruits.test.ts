import { describe, test, expect, afterAll, beforeAll } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import {
  fruits,
  type selectFruitSchema,
} from "../../../../../db/schema/test_rls/fruits";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { tenant } from "../../../../../db/schema/tenant";
import { harness } from "../../../../bun.test";
import { getFruitsForOrganization } from "../../../../../db/queries/test_rls/fruits";

describe("Fruits RLS Tests", () => {
  // Store seeded fruits for cleanup
  let seededFruits1: Record<string, any[]> = {};
  let seededFruits2: Record<string, any[]> = {};

  beforeAll(async () => {
    // Seed fruits
    seededFruits1 = await harness.db.seedSituation("test_seed_fruits_1.json");
    seededFruits2 = await harness.db.seedSituation(
      "test_seed_fruits_2.json",
      true
    );
  });

  afterAll(async () => {
    // Cleanup seeded fruits
    await harness.db.cleanupSeededSituation(seededFruits1);
    await harness.db.cleanupSeededSituation(seededFruits2);
  });

  describe("Test getFruitsForOrganization", () => {
    test("should return fruits for existing organization", async () => {
      const result = await getFruitsForOrganization(harness.user.id_token);

      expect(result).toBeArrayOfSize(4);
    });
  });
});
