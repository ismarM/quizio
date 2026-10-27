import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./support/paths";

try {
  process.loadEnvFile(path.join(__dirname, "..", ".env")); // shared testing/.env
} catch {
  // no .env file
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1, // the tests share one user and one database
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, teardown: "cleanup" },
    { name: "cleanup", testMatch: /purge\.teardown\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /purge\.teardown\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        storageState: AUTH_FILE,
      },
    },
  ],
});
