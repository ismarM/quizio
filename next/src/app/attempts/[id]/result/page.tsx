import { AttemptResult } from "@/components/attempts/AttemptResult";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";
import type { AttemptResultResponse } from "@/lib/types";
import { notFound } from "next/navigation";

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
  const result = await finishAttempt(quizId);

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AttemptResult result={result} />

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}

async function finishAttempt(quizId: number): Promise<AttemptResultResponse> {
  try {
    return await serverFetchJson<AttemptResultResponse>(
      `/api/quizzes/${quizId}/attempts/finish`,
      { method: "POST" }
    );
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 409) {
      return serverFetchJson<AttemptResultResponse>(
        `/api/quizzes/${quizId}/attempts`
      );
    }
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
