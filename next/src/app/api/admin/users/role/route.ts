import { NextResponse } from "next/server";

import { applyHmacHeaders } from "@/lib/api/request-integrity";
import { adminAuth } from "@/lib/clients/firebase-admin";
import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/auth/server-auth";
import type { SessionUser } from "@/lib/auth/server-auth";
import type { UserDTO, UserResponse } from "@/lib/types";

export const runtime = "nodejs";

function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} env var.`);
  }
  return value;
}

function buildBackendUrl(path: string) {
  return new URL(path, getRequiredEnv("GO_BACKEND_URL"));
}

async function backendFetch(
  path: string,
  init: RequestInit & { actor?: SessionUser } = {}
) {
  const url = buildBackendUrl(path);
  const headers = new Headers(init.headers);
  const body = init.body;

  if (init.actor) {
    headers.set("X-User-Email", init.actor.email ?? "");
    headers.set("X-User-Id", String(init.actor.postgresId));
    headers.set("X-User-IsAdmin", init.actor.isAdmin ? "true" : "false");
  }

  applyHmacHeaders(
    headers,
    `${url.pathname}${url.search}`,
    typeof body === "string" ? body : undefined,
    getRequiredEnv("HMAC_SECRET")
  );

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => null);
  return payload?.error ?? payload?.message ?? `Backend error: ${response.status}`;
}

async function lookupUserByEmail(email: string) {
  const response = await backendFetch("/api/users/lookup", {
    headers: { "X-User-Email": email },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = (await response.json()) as UserResponse;
  return payload.user;
}

async function updateUserRole(
  userId: number,
  isAdmin: boolean,
  actor: SessionUser
) {
  const body = JSON.stringify({ is_admin: isAdmin });
  const response = await backendFetch(`/api/users/${userId}/role`, {
    actor,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as UserResponse;
}

async function syncFirebaseRole(user: UserDTO) {
  try {
    const firebaseUser = await adminAuth.getUserByEmail(user.email);
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      postgresId: user.id,
      isAdmin: user.is_admin,
    });
  } catch (error) {
    console.error("Failed to sync Firebase admin claim:", error);
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sessionUser.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const isAdmin = payload?.isAdmin;

  if (typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
  }

  try {
    let targetUserId = sessionUser.postgresId;

    if (isAdmin) {
      const email =
        typeof payload?.email === "string"
          ? payload.email.trim().toLowerCase()
          : "";

      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const targetUser = await lookupUserByEmail(email);
      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserId = targetUser.id;
    }

    const updated = await updateUserRole(targetUserId, isAdmin, sessionUser);
    await syncFirebaseRole(updated.user);

    if (!isAdmin && targetUserId === sessionUser.postgresId) {
      await adminAuth.setCustomUserClaims(sessionUser.uid, {
        postgresId: sessionUser.postgresId,
        isAdmin: false,
      });

      const response = NextResponse.json({
        signedOut: true,
        user: updated.user,
      });
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ signedOut: false, user: updated.user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Role update failed" },
      { status: 502 }
    );
  }
}
