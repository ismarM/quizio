import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/lib/serverAuth";

export const runtime = "nodejs";

const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 5;
const GO_BACKEND_URL = process.env.GO_BACKEND_URL;

type BackendUser = {
  id: number;
  email: string;
  is_admin: boolean;
};

async function fetchUserByEmail(email: string) {
  if (!GO_BACKEND_URL) {
    throw new Error("Missing GO_BACKEND_URL");
  }
  const lookupUrl = new URL("/api/users/lookup", GO_BACKEND_URL);
  const response = await fetch(lookupUrl, {
    headers: { "X-User-Email": email },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`User lookup failed (${response.status})`);
  }
  const payload = await response.json();
  return payload?.user as BackendUser | null;
}

async function createUser(email: string) {
  if (!GO_BACKEND_URL) {
    throw new Error("Missing GO_BACKEND_URL");
  }
  const createUrl = new URL("/api/users", GO_BACKEND_URL);
  const response = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      is_admin: false,
      language: 0,
      theme: 0,
    }),
    cache: "no-store",
  });

  if (response.status === 409) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`User create failed (${response.status})`);
  }
  const payload = await response.json();
  return payload?.user as BackendUser | null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const normalizedEmail = decoded.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    let user = await fetchUserByEmail(normalizedEmail);
    if (!user) {
      const created = await createUser(normalizedEmail);
      user = created ?? (await fetchUserByEmail(normalizedEmail));
    }

    if (!user?.id) {
      return NextResponse.json({ error: "User resolution failed" }, { status: 502 });
    }

    await adminAuth.setCustomUserClaims(decoded.uid, {
      postgresId: user.id,
      isAdmin: user.is_admin,
    });

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const response = NextResponse.json({ status: "ok", uid: decoded.uid });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
