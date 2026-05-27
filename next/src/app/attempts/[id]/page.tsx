import { notFound } from "next/navigation";

import { AttemptPlayer } from "@/components/attempts/AttemptPlayer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { ServerFetchError, serverFetchJson } from "@/lib/serverFetch";
import { requireAuth } from "@/lib/serverAuth";
import type { AttemptResultResponse } from "@/lib/types";

type AttemptPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttemptPage({ params }: AttemptPageProps) {
  const { id } = await params;
  const quizId = Number(id);

  if (!Number.isFinite(quizId)) {
    notFound();
  }

  await requireAuth();

  const attempt = await loadAttempt(quizId);
  const timeLimitSeconds = attempt.quiz.time_limit_seconds ?? 0;
  const initialTimeLeftSeconds = calculateTimeLeftSeconds(
    attempt.attempt.start_time,
    timeLimitSeconds
  );

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AttemptPlayer
        quizId={quizId}
        quizTitle={attempt.quiz.title}
        questions={attempt.questions}
        responses={attempt.responses}
        initialTimeLeftSeconds={initialTimeLeftSeconds}
      />

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
      return startAttempt(quizId);
    }
    throw error;
  }
}

async function startAttempt(quizId: number): Promise<AttemptResultResponse> {
  try {
    return await serverFetchJson<AttemptResultResponse>(
      `/api/quizzes/${quizId}/attempts`,
      { method: "POST" }
    );
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 409) {
      return serverFetchJson<AttemptResultResponse>(
        `/api/quizzes/${quizId}/attempts`
      );
    }
    throw error;
  }
}

function calculateTimeLeftSeconds(startTime: string, timeLimitSeconds: number) {
  if (timeLimitSeconds <= 0) {
    return 0;
  }
  const startDate = new Date(startTime);
  if (Number.isNaN(startDate.getTime())) {
    return timeLimitSeconds;
  }
  const elapsedSeconds = Math.floor((Date.now() - startDate.getTime()) / 1000);
  return Math.max(0, timeLimitSeconds - elapsedSeconds);
}