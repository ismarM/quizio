// Applies seed/seed.sql to the database in DATABASE_URL.
//   npm run seed
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

try {
  process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env")); // shared testing/.env
} catch {
  // no .env file
}

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/appdb";

const sql = await readFile(join(dirname(fileURLToPath(import.meta.url)), "seed.sql"), "utf8");

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(sql);
  console.log("Seed applied.");
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
