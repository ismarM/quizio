import Link from "next/link";
import {
  BarChart3,
  Clock3,
  ListChecks,
  Medal,
  Play,
  UserRound,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { mapQuizDtoToListItem } from "@/lib/quiz-mappers";
import { routes } from "@/lib/routes";
import { ServerFetchError, serverFetchJson } from "@/lib/serverFetch";
import { requireAuth } from "@/lib/serverAuth";
import type { OpenSessionsResponse, QuizResponse, SubmissionsResponse, SubmissionSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type OpenSessionView = {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  timeLeftSeconds: number;
  startedAt: string;
};

function formatTimeLeft(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireAuth();

  let openSessions: OpenSessionView[] = [];
  let submissions: SubmissionSummary[] = [];
  let averageScore = 0;

  try {
    const [openSessionsData, submissionsData] = await Promise.all([
      serverFetchJson<OpenSessionsResponse>("/api/users/me/open-sessions"),
      serverFetchJson<SubmissionsResponse>("/api/users/me/submissions?limit=5&offset=0")
    ]);

    submissions = submissionsData.results;
    if (submissions.length > 0) {
      const totalAchieved = submissions.reduce((sum, s) => sum + s.achieved_points, 0);
      const totalMax = submissions.reduce((sum, s) => sum + s.max_points, 0);
      averageScore = totalMax > 0 ? Math.round((totalAchieved / totalMax) * 100) : 0;
    }

    const openSessionViews = await Promise.all(
      openSessionsData.attempts.map(async (session) => {
        const startTime = new Date(session.attempt.start_time);
        const elapsedSeconds = Math.max(
          0,
          Math.floor((Date.now() - startTime.getTime()) / 1000)
        );
        const timeLeftSeconds = Math.max(
          0,
          session.time_limit_seconds - elapsedSeconds
        );

        let quizTitle = `Quiz #${session.attempt.quiz_id}`;

        try {
          const quizResponse = await serverFetchJson<QuizResponse>(
            `/api/quizzes/${session.attempt.quiz_id}/info`
          );
          quizTitle = mapQuizDtoToListItem(quizResponse.quiz).title;
        } catch (error) {
          if (!(error instanceof ServerFetchError && error.status === 404)) {
            console.error("Failed to load quiz info:", error);
          }
        }

        return {
          attemptId: session.attempt.id,
          quizId: session.attempt.quiz_id,
          quizTitle,
          timeLeftSeconds,
          startedAt: formatSessionDate(session.attempt.start_time),
        } satisfies OpenSessionView;
      })
    );

    openSessions = openSessionViews.filter((session) => session.timeLeftSeconds > 0);
  } catch (error) {
    console.error("Failed to load open sessions:", error);
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>

            <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
              Welcome back.
            </h1>

            <p className="mt-4 max-w-xl q-body text-[#211F20]">
              Track your quiz progress, continue attempts and discover new
              quizzes.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <aside className="grid content-start gap-6">
            <section className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[8px_8px_0_#211F20] md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] font-display text-4xl text-[#006E5A]">
                  {initial || <UserRound className="h-8 w-8" />}
                </div>

                <div className="min-w-0">
                  <p className="font-display text-4xl leading-none text-[#211F20]">
                    {displayName}
                  </p>
                  <p className="mt-2 break-all q-body text-[#211F20]">
                    {user.email ?? "unknown email"}
                  </p>
                </div>
              </div>

              <div className="my-5 h-[2px] bg-[#211F20]" />

              <div className="grid gap-3">
                <Link
                  href={routes.quizzes}
                  className="q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                >
                  <Play className="h-4 w-4" />
                  Explore quizzes
                </Link>

                <Link
                  href={routes.home}
                  className="q-button q-button-secondary"
                >
                  Back home
                </Link>
              </div>
            </section>

            <section className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2] md:p-6">
              <p className="font-display text-[42px] leading-[0.9]">
                Keep improving.
              </p>
              <p className="mt-4 q-body">
                Your results help you see progress over time. Complete more
                quizzes to build your profile history.
              </p>
            </section>
          </aside>

          <div className="grid gap-6">
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<ListChecks className="h-5 w-5" />}
                label="Completed"
                value={submissions.length.toString()}
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Average"
                value={`${averageScore}%`}
              />
            </section>

            <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                    In progress
                  </p>
                  <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                    Open sessions
                  </h2>
                </div>
              </div>

              <div className="h-[2px] bg-[#211F20]" />

              {openSessions.length === 0 ? (
                <p className="mt-4 q-body text-[#211F20]">
                  No active quiz sessions right now.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {openSessions.map((session) => (
                    <article
                      key={session.attemptId}
                      className="grid gap-3 border border-[#D7D0C4] p-4 md:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-display text-2xl leading-none text-[#211F20]">
                          {session.quizTitle}
                        </p>
                        <p className="mt-1 q-mini text-[#8F8F8F]">
                          Started {session.startedAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 md:justify-end">
                        <span className="inline-flex items-center gap-2 text-[#006E5A]">
                          <Clock3 className="h-4 w-4" />
                          {formatTimeLeft(session.timeLeftSeconds)} left
                        </span>
                        <Link
                          href={routes.attempt(session.attemptId)}
                          className="q-button q-button-secondary"
                        >
                          Continue
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                    Activity
                  </p>
                  <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                    Recent attempts
                  </h2>
                </div>
              </div>

              <div className="h-[2px] bg-[#211F20]" />

              {submissions.length === 0 ? (
                <p className="mt-4 q-body text-[#211F20]">
                  No recent attempts. Start a quiz to see your history!
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {submissions.map((submission) => (
                    <article
                      key={submission.quiz_id + submission.start_time}
                      className="grid gap-3 border border-[#D7D0C4] p-4 md:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-display text-2xl leading-none text-[#211F20]">
                          {submission.quiz_title}
                        </p>
                        <p className="mt-1 q-mini text-[#8F8F8F]">
                          {formatSessionDate(submission.start_time)} · Completed
                        </p>
                      </div>

                      <div className="flex items-center gap-3 md:justify-end">
                        <span className="font-display text-2xl text-[#006E5A]">
                          {submission.achieved_points}/{submission.max_points}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </section>

      <MobileBottomNav />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="border-2 border-[#211F20] bg-[#FFFAF2] p-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center bg-[#DDECE8] text-[#006E5A]">
        {icon}
      </div>

      <p className="q-mini text-[#8F8F8F]">{label}</p>
      <p className="mt-1 font-display text-[42px] leading-none text-[#211F20]">
        {value}
      </p>
    </article>
  );
}