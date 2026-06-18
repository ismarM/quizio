import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { QuizDetailCard } from "@/components/quizzes/QuizDetailCard";
import { QuizLeaderboardMini } from "@/components/quizzes/QuizLeaderboardMini";
import { mapQuizDtoToListItem } from "@/lib/mappers/quiz";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { getSessionUser } from "@/lib/auth/server-auth";
import type {
  OpenSessionsResponse,
  QuizResponse,
  SubmissionSummary,
  SubmissionsResponse,
} from "@/lib/types";

type QuizDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { id } = await params;
  const quizId = Number(id);

  if (isNaN(quizId) || quizId <= 0) {
    notFound();
  }

  const [user, data] = await Promise.all([
    getSessionUser(),
    serverFetchJson<QuizResponse>(`/api/quizzes/${id}/info`).catch((error) => {
      if (error instanceof ServerFetchError && error.status === 404) {
        notFound();
      }
      throw error;
    }),
  ]);

  const quiz = mapQuizDtoToListItem(data.quiz);

  let resultSummary;
  let hasOpenAttempt = false;

  if (user) {
    const [summary, openAttempt] = await Promise.all([
      loadQuizResultSummary(quiz.id),
      loadHasOpenAttempt(quiz.id),
    ]);
    resultSummary = summary;
    hasOpenAttempt = !summary && openAttempt;
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-6">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            Quiz detail
          </p>
        </div>

        <div className="grid gap-8">
          <QuizDetailCard
            quiz={quiz}
            isLoggedIn={Boolean(user)}
            hasOpenAttempt={hasOpenAttempt}
            resultSummary={resultSummary}
          />
          <QuizLeaderboardMini quizId={quiz.id} />
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}

async function loadHasOpenAttempt(quizId: number) {
  try {
    const sessions = await serverFetchJson<OpenSessionsResponse>(
      "/api/users/me/open-sessions"
    );
    return sessions.attempts.some((session) => session.attempt.quiz_id === quizId);
  } catch (error) {
    console.error("Failed to load open quiz attempts:", error);
    return false;
  }
}

async function loadQuizResultSummary(quizId: number) {
  try {
    const submissions = await serverFetchJson<SubmissionsResponse>(
      "/api/users/me/submissions?limit=20&offset=0"
    );
    const match = submissions.results.find(
      (submission) => submission.quiz_id === quizId
    );
    if (!match) {
      return undefined;
    }
    return mapSubmissionSummary(match);
  } catch (error) {
    console.error("Failed to load quiz submission:", error);
    return undefined;
  }
}

function mapSubmissionSummary(submission: SubmissionSummary) {
  const totalMax = submission.max_points;
  const totalAchieved = submission.achieved_points;
  const percentage = totalMax > 0 ? Math.round((totalAchieved / totalMax) * 100) : 0;
  const timeTakenSeconds = submission.time_taken_seconds ?? 0;

  return {
    scoreText: `${Math.round(totalAchieved)}/${Math.round(totalMax)}`,
    percentage,
    timeTaken: formatDuration(timeTakenSeconds),
    submittedAt: formatDate(submission.start_time, timeTakenSeconds),
  };
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(startTime: string, timeTakenSeconds: number) {
  const startDate = new Date(startTime);
  if (Number.isNaN(startDate.getTime())) {
    return "Unknown";
  }
  const submitted = new Date(startDate.getTime() + timeTakenSeconds * 1000);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(submitted);
}
