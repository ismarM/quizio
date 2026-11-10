import path from "node:path";
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const envFile = path.join(__dirname, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Namenoma ne uvažam skupne konfiguracije: ta sproži TRUNCATE.
export default defineConfig({
  testDir: __dirname,
  testMatch: "scenarios.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(__dirname, "playwright-report"), open: "never" }],
  ],
  outputDir: path.join(__dirname, "test-results"),
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3001",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
