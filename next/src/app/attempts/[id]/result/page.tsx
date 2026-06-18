import { notFound, redirect } from "next/navigation";

import { AttemptResult } from "@/components/attempts/AttemptResult";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { routes } from "@/lib/navigation/routes";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";
import type { AttemptResultResponse } from "@/lib/types";

type AttemptResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttemptResultPage({
  params,
}: AttemptResultPageProps) {
  const { id } = await params;
  const quizId = Number(id);

  if (!Number.isFinite(quizId)) {
    notFound();
  }

  await requireAuth();
  const result = await loadAttempt(quizId);

  // If the attempt is still active (not finalized, and timer hasn't run out),
  // redirect them back to the active play page.
  if (result.attempt.time_taken_seconds === undefined || result.attempt.time_taken_seconds === null) {
    redirect(routes.attempt(quizId));
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AttemptResult result={result} />

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}

async function loadAttempt(quizId: number): Promise<AttemptResultResponse> {
  try {
    return await serverFetchJson<AttemptResultResponse>(
      `/api/quizzes/${quizId}/attempts`
    );
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
