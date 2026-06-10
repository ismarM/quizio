import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  ListChecks,
  Timer,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  loadAdminQuizAttemptReviews,
} from "@/components/admin/data/quiz-results.server";
import type { AdminAttemptListItem } from "@/components/admin/data/quiz-result-types";
import { routes } from "@/lib/navigation/routes";

type AdminQuizAttemptsSectionProps = {
  quizId: string | number;
};

type AdminQuizAttemptsLabels = {
  attempts: string;
  avgScore: string;
  correct: string;
  description: string;
  duration: string;
  emptyBody: string;
  emptyTitle: string;
  errorBody: string;
  errorTitle: string;
  eyebrow: string;
  inProgress: string;
  notSubmitted: string;
  open: string;
  openAttemptNote: string;
  review: string;
  score: string;
  started: string;
  submitted: string;
  title: string;
  unknown: string;
  userId: string;
};

export async function AdminQuizAttemptsSection({
  quizId,
}: AdminQuizAttemptsSectionProps) {
  const t = await getTranslations("admin.attempts");
  const locale = await getLocale();
  const labels = createAdminQuizAttemptsLabels(t);
  let attempts: AdminAttemptListItem[] = [];
  let hasError = false;

  try {
    attempts = await loadAdminQuizAttemptReviews(quizId);
  } catch (error) {
    console.error("Failed to load admin quiz attempts:", error);
    hasError = true;
  }

  if (hasError) {
    return <AdminQuizAttemptsError labels={labels} />;
  }

  return (
    <AdminQuizAttemptsList
      attempts={attempts}
      labels={labels}
      locale={locale}
      quizId={quizId}
    />
  );
}

export function AdminQuizAttemptsLoading({
  labels,
}: {
  labels?: Pick<AdminQuizAttemptsLabels, "description" | "eyebrow" | "title">;
}) {
  return (
    <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[4px_4px_0_#EBE4D8] md:p-6">
      <AttemptsSectionHeader
        description={labels?.description ?? ""}
        eyebrow={labels?.eyebrow ?? ""}
        title={labels?.title ?? ""}
      />

      <Separator className="my-5 h-[2px] bg-[#211F20]" />

      <div className="grid gap-3">
        {[1, 2, 3].map((item) => (
          <div
            className="grid gap-3 border border-[#D7D0C4] bg-[#FFFDF8] p-4 md:grid-cols-[1fr_170px]"
            key={item}
          >
            <div className="grid gap-2">
              <div className="h-5 w-40 animate-pulse bg-[#EBE4D8]" />
              <div className="h-4 w-56 animate-pulse bg-[#EBE4D8]" />
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="h-14 animate-pulse bg-[#EBE4D8]" />
                <div className="h-14 animate-pulse bg-[#EBE4D8]" />
                <div className="h-14 animate-pulse bg-[#EBE4D8]" />
              </div>
            </div>
            <div className="h-12 animate-pulse bg-[#EBE4D8]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminQuizAttemptsList({
  attempts,
  labels,
  locale,
  quizId,
}: {
  attempts: AdminAttemptListItem[];
  labels: AdminQuizAttemptsLabels;
  locale: string;
  quizId: string | number;
}) {
  const submittedCount = attempts.filter(
    (attempt) => attempt.status === "submitted"
  ).length;

  return (
    <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[4px_4px_0_#EBE4D8] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <AttemptsSectionHeader
          description={labels.description}
          eyebrow={labels.eyebrow}
          title={labels.title}
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
          <CompactStat
            icon={<Users className="h-4 w-4" />}
            label={labels.attempts}
            value={`${attempts.length}`}
          />
          <CompactStat
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={labels.submitted}
            value={`${submittedCount}`}
          />
          <CompactStat
            icon={<Clock3 className="h-4 w-4" />}
            label={labels.open}
            value={`${attempts.length - submittedCount}`}
          />
          <CompactStat
            icon={<Trophy className="h-4 w-4" />}
            label={labels.avgScore}
            value={formatAverageScore(attempts)}
          />
        </div>
      </div>

      <Separator className="my-5 h-[2px] bg-[#211F20]" />

      {attempts.length === 0 ? (
        <AdminQuizAttemptsEmpty labels={labels} />
      ) : (
        <div className="grid gap-3">
          {attempts.map((attempt) => (
            <AdminQuizAttemptRow
              attempt={attempt}
              key={attempt.attemptId}
              labels={labels}
              locale={locale}
              quizId={quizId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AdminQuizAttemptRow({
  attempt,
  labels,
  locale,
  quizId,
}: {
  attempt: AdminAttemptListItem;
  labels: AdminQuizAttemptsLabels;
  locale: string;
  quizId: string | number;
}) {
  const isSubmitted = attempt.status === "submitted";

  return (
    <article className="border-2 border-[#D7D0C4] bg-[#FFFDF8] p-4 transition hover:border-[#211F20]">
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8] text-[#006E5A]">
              <Users className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <p className="truncate font-display text-2xl leading-none text-[#211F20]">
                {attempt.userName}
              </p>
              <p className="q-mini text-[#8F8F8F]">
                {labels.userId} #{attempt.userId}
              </p>
            </div>

            <AttemptStatusBadge labels={labels} status={attempt.status} />
          </div>

          <Link
            className="q-button q-button-primary flex h-11 shrink-0 items-center justify-center gap-1 border-[#FF3C38] bg-[#FF3C38] px-4"
            href={routes.adminQuizAttempt(quizId, attempt.userId)}
          >
            <Eye className="h-4 w-4" />
            <span className="pt-[3px]">{labels.review}</span>
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <ResultMetaItem
            icon={<Trophy className="h-4 w-4" />}
            label={labels.score}
            value={formatScore(attempt.score, attempt.maxScore)}
          />
          <ResultMetaItem
            icon={<ListChecks className="h-4 w-4" />}
            label={labels.correct}
            value={`${attempt.correctAnswers}/${attempt.totalQuestions}`}
          />
          <ResultMetaItem
            icon={<Timer className="h-4 w-4" />}
            label={labels.duration}
            value={formatDuration(attempt.timeTakenSeconds, labels)}
          />
          <ResultMetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label={labels.submitted}
            value={formatDateTime(attempt.submittedAt, locale, labels)}
          />
          <ResultMetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label={labels.started}
            value={formatDateTime(attempt.startedAt, locale, labels)}
          />
        </div>

        {!isSubmitted ? (
          <p className="mt-3 q-mini text-[#8F8F8F]">
            {labels.openAttemptNote}
          </p>
        ) : null}
      </div>

    </article>
  );
}

function AdminQuizAttemptsEmpty({
  labels,
}: {
  labels: AdminQuizAttemptsLabels;
}) {
  return (
    <div className="border-2 border-dashed border-[#D7D0C4] bg-[#FFFDF8] p-8 text-center">
      <ListChecks className="mx-auto mb-4 h-10 w-10 text-[#006E5A]" />
      <p className="font-display text-4xl leading-none text-[#211F20]">
        {labels.emptyTitle}
      </p>
      <p className="mx-auto mt-2 max-w-xl q-body text-[#211F20]">
        {labels.emptyBody}
      </p>
    </div>
  );
}

function AdminQuizAttemptsError({
  labels,
}: {
  labels: AdminQuizAttemptsLabels;
}) {
  return (
    <section className="border-2 border-[#FF3C38] bg-[#FFFDF8] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 h-5 w-5 text-[#FF3C38]" />
        <div>
          <p className="font-display text-3xl leading-none text-[#211F20]">
            {labels.errorTitle}
          </p>
          <p className="mt-2 q-body text-[#211F20]">
            {labels.errorBody}
          </p>
        </div>
      </div>
    </section>
  );
}

function AttemptsSectionHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
        {eyebrow}
      </p>
      <h2 className="font-display text-[48px] leading-none text-[#211F20]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl q-body text-[#211F20]">{description}</p>
    </div>
  );
}

function CompactStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-3">
      <div className="mb-2 text-[#006E5A]">{icon}</div>
      <p className="q-mini text-[#211F20]">{label}</p>
      <p className="font-display text-3xl leading-none text-[#211F20]">
        {value}
      </p>
    </div>
  );
}

function ResultMetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-h-[58px] grid-cols-[auto_1fr] items-center gap-x-2 border border-[#EBE4D8] bg-[#FFFAF2] px-3 py-2">
      <span className="row-span-2 text-[#006E5A]">{icon}</span>
      <span className="q-mini text-[#8F8F8F]">{label}</span>
      <span className="truncate text-[14px] font-semibold leading-5 text-[#211F20]">
        {value}
      </span>
    </div>
  );
}

function AttemptStatusBadge({
  labels,
  status,
}: {
  labels: AdminQuizAttemptsLabels;
  status: AdminAttemptListItem["status"];
}) {
  const isSubmitted = status === "submitted";

  return (
    <Badge
      className={[
        "rounded-none border-0 px-2 py-1 text-[12px] leading-4",
        isSubmitted
          ? "bg-[#DDECE8] text-[#006E5A]"
          : "bg-[#EBE4D8] text-[#211F20]",
      ].join(" ")}
      variant="secondary"
    >
      {isSubmitted ? labels.submitted : labels.inProgress}
    </Badge>
  );
}

function formatAverageScore(attempts: AdminAttemptListItem[]) {
  const submitted = attempts.filter(
    (attempt) => attempt.status === "submitted" && attempt.maxScore > 0
  );
  if (submitted.length === 0) {
    return "0%";
  }

  const average =
    submitted.reduce(
      (sum, attempt) => sum + attempt.score / attempt.maxScore,
      0
    ) / submitted.length;

  return `${Math.round(average * 100)}%`;
}

function formatScore(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return "0/0";
  }
  return `${formatNumber(score)}/${formatNumber(maxScore)}`;
}

function formatDuration(totalSeconds: number | undefined, labels: AdminQuizAttemptsLabels) {
  if (typeof totalSeconds !== "number") {
    return labels.inProgress;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTime(
  value: string | undefined,
  locale: string,
  labels: AdminQuizAttemptsLabels
) {
  if (!value) {
    return labels.notSubmitted;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return labels.unknown;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function createAdminQuizAttemptsLabels(
  t: (key: string) => string
): AdminQuizAttemptsLabels {
  return {
    attempts: t("attempts"),
    avgScore: t("avgScore"),
    correct: t("correct"),
    description: t("description"),
    duration: t("duration"),
    emptyBody: t("emptyBody"),
    emptyTitle: t("emptyTitle"),
    errorBody: t("errorBody"),
    errorTitle: t("errorTitle"),
    eyebrow: t("eyebrow"),
    inProgress: t("inProgress"),
    notSubmitted: t("notSubmitted"),
    open: t("open"),
    openAttemptNote: t("openAttemptNote"),
    review: t("review"),
    score: t("score"),
    started: t("started"),
    submitted: t("submitted"),
    title: t("title"),
    unknown: t("unknown"),
    userId: t("userId"),
  };
}
