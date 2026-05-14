import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminAuth } from "@/lib/firebaseAdmin";

export const SESSION_COOKIE_NAME = "session";

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userRecord = await adminAuth.getUser(decoded.uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email ?? null,
      displayName: userRecord.displayName ?? null,
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

export async function requireEmail(
  expectedEmail: string
): Promise<SessionUser> {
  const user = await requireAuth();
  const normalizedExpected = expectedEmail.trim().toLowerCase();
  const normalizedActual = user.email?.trim().toLowerCase() ?? "";

  if (!normalizedActual || normalizedActual !== normalizedExpected) {
    redirect("/login?reason=unauthorized");
  }

  return user;
}
