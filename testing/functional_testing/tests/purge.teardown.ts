import { test as teardown } from "@playwright/test";

import { purgeDatabase } from "../support/db";

// Runs once after all specs (also when some of them failed): removes all test data.
teardown("purge the database", async () => {
  await purgeDatabase();
});
