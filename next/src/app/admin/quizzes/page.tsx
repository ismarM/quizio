import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  redirect("/admin");
}