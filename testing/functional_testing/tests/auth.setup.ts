import { test as setup } from "@playwright/test";

import { loginViaUi } from "../support/auth";
import { applySeed, purgeDatabase } from "../support/db";
import { AUTH_FILE } from "../support/paths";

// Runs once before all specs: purges and seeds the database, logs in and stores the session.
setup("purge and seed the database, log in", async ({ page }) => {
  await purgeDatabase();
  await applySeed();
  await loginViaUi(page);
  await page.context().storageState({ path: AUTH_FILE });
});
