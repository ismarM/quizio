import "server-only";

import { getSessionUser } from "@/lib/auth/server-auth";
import { applyHmacHeaders } from "@/lib/api/request-integrity";
import type { SignableBody } from "@/lib/api/request-integrity";

function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} env var.`);
  }
  return value;
}

const GO_BACKEND_URL = getRequiredEnv("GO_BACKEND_URL");
const HMAC_SECRET = getRequiredEnv("HMAC_SECRET");

export class ServerFetchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ServerFetchError";
    this.status = status;
  }
}

function getSignableBody(body: RequestInit["body"]): SignableBody {
  if (!body) {
    return null;
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof ArrayBuffer) {
    return body;
  }

  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }

  return null;
}

export async function serverFetch(path: string, init: RequestInit = {}) {
  const user = await getSessionUser();
  const url = new URL(path, GO_BACKEND_URL);
  const headers = new Headers(init.headers);
  const body = init.body;

  if (user) {
    headers.set("X-User-Email", user.email ?? "");
    headers.set("X-User-Id", String(user.postgresId));
    headers.set("X-User-IsAdmin", user.isAdmin ? "true" : "false");
  }

  applyHmacHeaders(
    headers,
    url.pathname + url.search,
    getSignableBody(body),
    HMAC_SECRET
  );

  return fetch(url, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
    body,
  });
}

export async function serverFetchJson<T>(path: string, init: RequestInit = {}) {
  const response = await serverFetch(path, init);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error ?? `Backend error: ${response.status}`;
    throw new ServerFetchError(response.status, message);
  }

  return response.json() as Promise<T>;
}
