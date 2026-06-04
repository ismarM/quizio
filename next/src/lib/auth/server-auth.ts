import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminAuth } from "@/lib/clients/firebase-admin";

export const SESSION_COOKIE_NAME = "session";

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  postgresId: number;
  isAdmin: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const postgresId = Number((decoded as { postgresId?: unknown }).postgresId);
    const isAdmin = Boolean((decoded as { isAdmin?: unknown }).isAdmin);

    if (!Number.isFinite(postgresId)) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      postgresId,
      isAdmin,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
