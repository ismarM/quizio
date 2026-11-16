import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { parseEnv } from "node:util";

import pg from "pg";

const { Client } = pg;
const testDir = import.meta.dirname;
const repoRoot = path.resolve(testDir, "..", "..", "..");
const outputPath = path.join(testDir, ".env");
const nextEnvPath = path.join(repoRoot, "next", ".env.local");
const backendEnvPath = path.join(repoRoot, "backend", ".env");

if (!existsSync(nextEnvPath) || !existsSync(backendEnvPath)) {
  throw new Error("Manjkata lokalna next/.env.local ali backend/.env.");
}

const nextEnv = parseEnv(readFileSync(nextEnvPath, "utf8"));
const backendEnv = parseEnv(readFileSync(backendEnvPath, "utf8"));
const requireFromNext = createRequire(path.join(repoRoot, "next", "package.json"));
const { cert, initializeApp } = requireFromNext("firebase-admin/app");
const { getAuth } = requireFromNext("firebase-admin/auth");

const app = initializeApp({
  credential: cert({
    projectId: nextEnv.FIREBASE_PROJECT_ID,
    clientEmail: nextEnv.FIREBASE_CLIENT_EMAIL,
    privateKey: nextEnv.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const auth = getAuth(app);

const accounts = [
  { role: "ADMIN", email: "omar.n5.admin@example.com", isAdmin: true, displayName: "Omar N5 Admin" },
  { role: "USER_A", email: "omar.n5.usera@example.com", isAdmin: false, displayName: "Omar N5 User A" },
  { role: "USER_B", email: "omar.n5.userb@example.com", isAdmin: false, displayName: "Omar N5 User B" },
];

let passwords;
if (existsSync(outputPath)) {
  const current = parseEnv(readFileSync(outputPath, "utf8"));
  passwords = Object.fromEntries(accounts.map(({ role }) => {
    const password = current[`${role}_PASSWORD`];
    if (!password) throw new Error(`V obstoječi omar/.env manjka ${role}_PASSWORD.`);
    return [role, password];
  }));
  for (const item of accounts) {
    try {
      await auth.getUserByEmail(item.email);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") throw error;
      await auth.createUser({
        email: item.email,
        password: passwords[item.role],
        emailVerified: true,
        displayName: item.displayName,
      });
    }
  }
} else {
  for (const { email } of accounts) {
    try {
      await auth.getUserByEmail(email);
      throw new Error(`Firebase račun ${email} že obstaja, lokalnega gesla pa ni. Računa ne bom ponastavil.`);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") throw error;
    }
  }
  passwords = Object.fromEntries(accounts.map(({ role }) => [role, randomBytes(24).toString("base64url")]));
  const created = [];
  try {
    for (const item of accounts) {
      const user = await auth.createUser({
        email: item.email,
        password: passwords[item.role],
        emailVerified: true,
        displayName: item.displayName,
      });
      created.push(user.uid);
    }
  } catch (error) {
    await Promise.allSettled(created.map((uid) => auth.deleteUser(uid)));
    throw error;
  }
}

const databaseName = backendEnv.DB_NAME ?? "appdb";
const databaseUrl = `postgres://${encodeURIComponent(backendEnv.DB_USER ?? "postgres")}:${encodeURIComponent(backendEnv.DB_PASSWORD ?? "postgres")}@localhost:${backendEnv.DB_PORT ?? "5432"}/${databaseName}`;
const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  const selected = await client.query("SELECT current_database() AS name");
  if (selected.rows[0].name !== databaseName) throw new Error("Povezan sem z napačno lokalno bazo.");
  for (const item of accounts) {
    await client.query(
      `INSERT INTO quizio."User" (email, is_admin, displayName, language, theme)
       VALUES ($1, $2, $3, 0, 0)
       ON CONFLICT (email) DO UPDATE
       SET is_admin = EXCLUDED.is_admin,
           displayName = EXCLUDED.displayName,
           language = 0,
           theme = 0`,
      [item.email, item.isAdmin, item.displayName],
    );
  }
} finally {
  await client.end();
}

const lines = [
  "BASE_URL=http://localhost:3000",
  `DATABASE_URL=${databaseUrl}`,
  ...accounts.flatMap((item) => [
    `${item.role}_EMAIL=${item.email}`,
    `${item.role}_PASSWORD=${passwords[item.role]}`,
  ]),
  "",
];
await writeFile(outputPath, lines.join("\n"), { encoding: "utf8", mode: 0o600 });
console.log("Pripravljeni so trije namenski računi in lokalni omar/.env; gesla niso izpisana.");
