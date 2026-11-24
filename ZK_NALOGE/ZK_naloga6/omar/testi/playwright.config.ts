import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "../../../../testing/functional_testing/node_modules/@playwright/test";

const functionalRoot = path.resolve(__dirname, "../../../../testing/functional_testing");
const envFile = path.join(functionalRoot, "omar", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);
const outputSuffix = process.env.N6_OUTPUT_SUFFIX ? `-${process.env.N6_OUTPUT_SUFFIX}` : "";

export default defineConfig({
  testDir: __dirname,
  testMatch: "additional.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 150_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: path.resolve(__dirname, `../dokazila/playwright-report${outputSuffix}`), open: "never" }],
  ],
  outputDir: path.resolve(__dirname, `../dokazila/test-results${outputSuffix}`),
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
