import Link from "next/link";
import {
  BarChart3,
  Clock3,
  Inbox,
  ListChecks,
  Medal,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { DashboardProfileCard } from "@/components/dashboard/DashboardProfileCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mapQuizDtoToListItem } from "@/lib/mappers/quiz";
import { routes } from "@/lib/navigation/routes";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";
import type {
  OpenSessionsResponse,
  QuizResponse,
  SubmissionsResponse,
  SubmissionSummary,
  UserResponse,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type OpenSessionView = {
  attemptId: number;
  quizTitle: string;
  timeLeftSeconds: number;
  startedAt: string;
};

function formatTimeLeft(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function toDateLocale(locale: string) {
  return locale === "sl" ? "sl-SI" : "en-US";
}

function formatShortDate(value: string, locale: string, unknown: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return unknown;
  }
  return new Intl.DateTimeFormat(toDateLocale(locale), {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAttemptDate(value: string, locale: string, unknown: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return unknown;
  }
  return new Intl.DateTimeFormat(toDateLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getScorePercent(submission: SubmissionSummary) {
  if (submission.max_points <= 0) {
    return 0;
  }
  return Math.round((submission.achieved_points / submission.max_points) * 100);
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const user = await requireAuth();

  let profile: UserResponse["user"] | null = null;
  let openSessions: OpenSessionView[] = [];
  let submissions: SubmissionSummary[] = [];

  try {
    const profileData = await serverFetchJson<UserResponse>("/api/users/me");
    profile = profileData.user;
  } catch (error) {
    console.error("Failed to load user profile:", error);
  }

  try {
    const [openSessionsData, submissionsData] = await Promise.all([
      serverFetchJson<OpenSessionsResponse>("/api/users/me/open-sessions"),
      serverFetchJson<SubmissionsResponse>(
        "/api/users/me/submissions?limit=5&offset=0"
      ),
    ]);

    submissions = submissionsData.results;

    const openSessionViews = await Promise.all(
      openSessionsData.attempts.map(async (session) => {
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
          quizTitle,
          timeLeftSeconds: session.time_limit_seconds,
          startedAt: formatShortDate(
            session.attempt.start_time,
            locale,
            t("unknown")
          ),
        } satisfies OpenSessionView;
      })
    );

    openSessions = openSessionViews.filter(
      (session) => session.timeLeftSeconds > 0
    );
  } catch (error) {
    console.error("Failed to load dashboard activity:", error);
  }

  const email = profile?.email ?? user.email ?? "unknown email";
  const displayName =
    profile?.display_name || user.displayName || email.split("@")[0] || "User";
  const initial = displayName.slice(0, 1).toUpperCase();
  const completedCount = submissions.length;
  const totalAchieved = submissions.reduce(
    (sum, submission) => sum + submission.achieved_points,
    0
  );
  const totalMax = submissions.reduce(
    (sum, submission) => sum + submission.max_points,
    0
  );
  const averageScore =
    totalMax > 0 ? Math.round((totalAchieved / totalMax) * 100) : 0;
  const bestSubmission = submissions.reduce<SubmissionSummary | null>(
    (best, submission) => {
      if (!best) {
        return submission;
      }

      const currentPercent = getScorePercent(submission);
      const bestPercent = getScorePercent(best);

      if (currentPercent > bestPercent) {
        return submission;
      }

      if (
        currentPercent === bestPercent &&
        submission.achieved_points > best.achieved_points
      ) {
        return submission;
      }

      return best;
    },
    null
  );
  const bestScore = bestSubmission ? getScorePercent(bestSubmission) : 0;
  const bestScoreDetail = bestSubmission
    ? t("bestOn", { quizTitle: bestSubmission.quiz_title })
    : t("noQuizYet");

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-7 md:pb-20 md:pt-10">
        <div className="mb-7">
          <h1 className="font-display text-[62px] leading-[0.86] text-[var(--q-ink)] md:text-[104px]">
            {t("heading")}
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[var(--q-ink)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.32fr]">
          <aside className="grid content-start gap-6">
            <DashboardProfileCard
              displayName={displayName}
              email={email}
              initial={initial}
              isAdmin={profile?.is_admin ?? user.isAdmin}
              language={profile?.language ?? 0}
              theme={profile?.theme ?? 0}
            />

            <ProgressCard completedCount={completedCount} />
          </aside>

          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<ListChecks className="h-6 w-6" />}
                label={t("completedQuizzes")}
                value={completedCount.toString()}
              />
              <StatCard
                icon={<BarChart3 className="h-6 w-6" />}
                label={t("averageScore")}
                value={`${averageScore}%`}
              />
              <StatCard
                icon={<Medal className="h-6 w-6" />}
                label={t("bestScore")}
                value={`${bestScore}%`}
                detail={bestScoreDetail}
              />
            </section>

            <OpenSessionsPanel sessions={openSessions} />
            <RecentAttemptsPanel
              locale={locale}
              submissions={submissions}
              unknown={t("unknown")}
            />
          </div>
        </div>
      </section>

      <MobileBottomNav />
    </main>
  );
}

function ProgressCard({ completedCount }: { completedCount: number }) {
  const t = useTranslations("dashboard");
  const milestone = Math.max(10, Math.ceil((completedCount + 1) / 10) * 10);
  const progress = Math.min(100, Math.round((completedCount / milestone) * 100));

  return (
    <section className="overflow-hidden border-2 border-[var(--q-green)] bg-[var(--q-green)] p-6 text-[var(--q-on-accent)] shadow-[6px_6px_0_var(--q-shadow)]">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--q-green-soft)] text-[var(--q-green)]">
        <BarChart3 className="h-7 w-7" />
      </div>

      <h2 className="font-display text-[44px] leading-[0.9] md:text-[52px]">
        {t("keepImproving")}
      </h2>
      <p className="mt-5 max-w-sm text-[17px] leading-7">
        {t("keepImprovingBody")}
      </p>

      <div className="mt-8 border border-[var(--q-green-soft)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-[15px]">
          <span>{t("roll")}</span>
          <span>{t("completedCount", { count: completedCount })}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--q-green-soft)]">
          <div
            className="h-full rounded-full bg-[var(--q-on-accent)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-[15px]">
          {t("nextMilestone", { count: milestone })}
        </p>
      </div>
    </section>
  );
}

function StatCard({
  detail,
  icon,
  label,
  value,
}: {
  detail?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="border-2 border-[var(--q-muted-strong)] bg-[var(--q-surface)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--q-border)] hover:shadow-[4px_4px_0_var(--q-shadow)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center bg-[var(--q-green-soft)] text-[var(--q-green)]">
        {icon}
      </div>
      <p className="text-[15px] leading-6 text-[var(--q-ink)]">{label}</p>
      <p className="mt-1 font-display text-[44px] leading-none text-[var(--q-ink)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 line-clamp-1 text-[13px] leading-5 text-[var(--q-ink-soft)]">
          {detail}
        </p>
      ) : null}
    </article>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <span className="inline-flex bg-[var(--q-green-soft)] px-3 py-1 q-mini font-bold uppercase text-[var(--q-green)]">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[38px] leading-none text-[var(--q-ink)] md:text-[44px]">
        {title}
      </h2>
    </div>
  );
}

function OpenSessionsPanel({ sessions }: { sessions: OpenSessionView[] }) {
  const t = useTranslations("dashboard");

  return (
    <section className="border-2 border-[var(--q-muted-strong)] bg-[var(--q-surface)] p-5 md:p-6">
      <SectionTitle eyebrow={t("inProgress")} title={t("openSessions")} />
      <Separator className="my-4 h-[2px] bg-[var(--q-border)]" />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title={t("noActiveSessions")}
          description={t("startQuizHistory")}
        />
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <article
              key={session.attemptId}
              className="grid gap-4 border border-[var(--q-muted-strong)] bg-[var(--q-surface-alt)] p-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="font-display text-2xl leading-none text-[var(--q-ink)]">
                  {session.quizTitle}
                </p>
                <p className="mt-1 q-mini text-[var(--q-ink-muted)]">
                  {t("started", { date: session.startedAt })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--q-green)]">
                  <Clock3 className="h-4 w-4" />
                  {t("timeLimit", {
                    time: formatTimeLeft(session.timeLeftSeconds),
                  })}
                </span>
                <Link
                  href={routes.attempt(session.attemptId)}
                  className="q-button q-button-secondary"
                >
                  {t("continue")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentAttemptsPanel({
  locale,
  submissions,
  unknown,
}: {
  locale: string;
  submissions: SubmissionSummary[];
  unknown: string;
}) {
  const t = useTranslations("dashboard");

  return (
    <section className="border-2 border-[var(--q-muted-strong)] bg-[var(--q-surface)] p-5 md:p-6">
      <SectionTitle eyebrow={t("activity")} title={t("recentAttempts")} />
      <Separator className="my-4 h-[2px] bg-[var(--q-border)]" />

      {submissions.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title={t("noRecentAttempts")}
          description={t("startBuildHistory")}
        />
      ) : (
        <div className="overflow-hidden border border-[var(--q-muted-strong)]">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_180px_130px_90px] border-b border-[var(--q-muted-strong)] bg-[var(--q-surface-alt)] px-4 py-3 q-mini font-bold uppercase text-[var(--q-ink)] md:grid">
            <span>{t("quiz")}</span>
            <span>{t("date")}</span>
            <span>{t("status")}</span>
            <span className="text-right">{t("score")}</span>
          </div>

          {submissions.map((submission) => {
            const scorePercent = getScorePercent(submission);

            return (
              <article
                key={`${submission.quiz_id}-${submission.start_time}`}
                className="grid gap-3 border-b border-[var(--q-muted-strong)] bg-[var(--q-surface-alt)] px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_180px_130px_90px] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-[22px] leading-none text-[var(--q-ink)]">
                    {submission.quiz_title}
                  </p>
                  <p className="mt-1 q-mini text-[var(--q-ink-muted)] md:hidden">
                    {formatAttemptDate(submission.start_time, locale, unknown)}
                  </p>
                </div>

                <p className="hidden text-[13px] leading-5 text-[var(--q-ink-soft)] md:block">
                  {formatAttemptDate(submission.start_time, locale, unknown)}
                </p>

                <Badge
                  className="w-fit rounded-none border-0 bg-[var(--q-green-soft)] px-2 py-1 q-mini font-bold uppercase text-[var(--q-green)]"
                  variant="secondary"
                >
                  {t("completed")}
                </Badge>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span
                    className={[
                      "font-display text-[24px] leading-none",
                      scorePercent === 0 ? "text-[var(--q-red)]" : "text-[var(--q-green)]",
                    ].join(" ")}
                  >
                    {submission.achieved_points}/{submission.max_points}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center md:flex-row md:text-left">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--q-green-soft)] text-[var(--q-green)]">
        {icon}
      </div>
      <div>
        <p className="text-[17px] font-semibold leading-6 text-[var(--q-ink)]">
          {title}
        </p>
        <p className="mt-1 text-[15px] leading-6 text-[var(--q-ink)]">
          {description}
        </p>
      </div>
    </div>
  );
}
