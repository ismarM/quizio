import path from "node:path";

export const AUTH_FILE = path.join(__dirname, "..", ".auth", "user.json");
export const SEED_FILE = path.join(__dirname, "..", "seed", "seed.sql");
export const PURGE_FILE = path.join(__dirname, "..", "..", "purge.sql");
