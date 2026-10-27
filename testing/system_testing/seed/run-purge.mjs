// Applies testing/purge.sql (removes all application data) to the database in DATABASE_URL.
//   npm run purge
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(join(here, "..", "..", ".env")); // shared testing/.env
} catch {
  // no .env file
}

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/appdb";

const sql = await readFile(join(here, "..", "..", "purge.sql"), "utf8");

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(sql);
  console.log("Database purged.");
} catch (error) {
  console.error("Purge failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
