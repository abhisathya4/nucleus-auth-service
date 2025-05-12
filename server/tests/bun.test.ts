import { afterAll, beforeAll } from "bun:test";
import { TestHarness } from "./helpers/harness";
import test_env from "./helpers/test-env";

// Global test harness instance
let harness: TestHarness;

// Global setup - runs once before all tests
beforeAll(async () => {
  harness = await TestHarness.globalSetup();
  console.log("Test harness initialized successfully");
});

// Global teardown - runs once after all tests
afterAll(async () => {
  if (harness && test_env.CLEANUP) {
    await harness.globalTeardown();
    console.log("Test harness cleaned up successfully");
  }
});

process.on("beforeExit", async () => {
  console.log("Process exiting, running global cleanup");
  if (harness && test_env.CLEANUP) {
    await harness.globalTeardown();
    console.log("Test harness cleaned up successfully");
  }
});

// Export the harness for use in tests
export { harness };
