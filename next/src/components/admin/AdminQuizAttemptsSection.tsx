import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  ListChecks,
  Mail,
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

export async function AdminQuizAttemptsSection({
  quizId,
}: AdminQuizAttemptsSectionProps) {
  let attempts: AdminAttemptListItem[] = [];
  let hasError = false;

  try {
    attempts = await loadAdminQuizAttemptReviews(quizId);
  } catch (error) {
    console.error("Failed to load admin quiz attempts:", error);
    hasError = true;
  }

  if (hasError) {
    return <AdminQuizAttemptsError />;
  }

  return <AdminQuizAttemptsList attempts={attempts} quizId={quizId} />;
}

export function AdminQuizAttemptsLoading() {
  return (
    <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[4px_4px_0_#EBE4D8] md:p-6">
      <AttemptsSectionHeader
        description="Loading attempt results for this quiz."
        eyebrow="Results"
        title="Attempts"
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
  quizId,
}: {
  attempts: AdminAttemptListItem[];
  quizId: string | number;
}) {
  const submittedCount = attempts.filter(
    (attempt) => attempt.status === "submitted"
  ).length;

  return (
    <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[4px_4px_0_#EBE4D8] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <AttemptsSectionHeader
          description="Review submitted and in-progress quiz attempts without leaving the admin flow."
          eyebrow="Results"
          title="Attempts"
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
          <CompactStat
            icon={<Users className="h-4 w-4" />}
            label="Attempts"
            value={`${attempts.length}`}
          />
          <CompactStat
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Submitted"
            value={`${submittedCount}`}
          />
          <CompactStat
            icon={<Clock3 className="h-4 w-4" />}
            label="Open"
            value={`${attempts.length - submittedCount}`}
          />
          <CompactStat
            icon={<Trophy className="h-4 w-4" />}
            label="Avg score"
            value={formatAverageScore(attempts)}
          />
        </div>
      </div>

      <Separator className="my-5 h-[2px] bg-[#211F20]" />

      {attempts.length === 0 ? (
        <AdminQuizAttemptsEmpty />
      ) : (
        <div className="grid gap-3">
          {attempts.map((attempt) => (
            <AdminQuizAttemptRow
              attempt={attempt}
              key={attempt.attemptId}
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
  quizId,
}: {
  attempt: AdminAttemptListItem;
  quizId: string | number;
}) {
  const isSubmitted = attempt.status === "submitted";

  return (
    <article className="border-2 border-[#D7D0C4] bg-[#FFFDF8] p-4 transition hover:border-[#211F20]">
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8] text-[#006E5A]">
              <Mail className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <p className="truncate font-display text-2xl leading-none text-[#211F20]">
                {attempt.userEmail}
              </p>
              <p className="q-mini text-[#8F8F8F]">User #{attempt.userId}</p>
            </div>

            <AttemptStatusBadge status={attempt.status} />
          </div>

          <Link
            className="q-button q-button-primary flex h-10 shrink-0 items-center justify-center gap-1 border-[#FF3C38] bg-[#FF3C38] px-4"
            href={routes.adminQuizAttempt(quizId, attempt.userId)}
          >
            <Eye className="h-4 w-4" />
            <span className="pt-[3px]">Review</span>
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <ResultMetaItem
            icon={<Trophy className="h-4 w-4" />}
            label="Score"
            value={formatScore(attempt.score, attempt.maxScore)}
          />
          <ResultMetaItem
            icon={<ListChecks className="h-4 w-4" />}
            label="Correct"
            value={`${attempt.correctAnswers}/${attempt.totalQuestions}`}
          />
          <ResultMetaItem
            icon={<Timer className="h-4 w-4" />}
            label="Duration"
            value={formatDuration(attempt.timeTakenSeconds)}
          />
          <ResultMetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Submitted"
            value={formatDateTime(attempt.submittedAt)}
          />
          <ResultMetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Started"
            value={formatDateTime(attempt.startedAt)}
          />
        </div>

        {!isSubmitted ? (
          <p className="mt-3 q-mini text-[#8F8F8F]">
            This attempt is still open, so final submission time and score may change.
          </p>
        ) : null}
      </div>

    </article>
  );
}

function AdminQuizAttemptsEmpty() {
  return (
    <div className="border-2 border-dashed border-[#D7D0C4] bg-[#FFFDF8] p-8 text-center">
      <ListChecks className="mx-auto mb-4 h-10 w-10 text-[#006E5A]" />
      <p className="font-display text-4xl leading-none text-[#211F20]">
        No attempts yet
      </p>
      <p className="mx-auto mt-2 max-w-xl q-body text-[#211F20]">
        When users start or submit this quiz, their attempts will appear here for
        admin review.
      </p>
    </div>
  );
}

function AdminQuizAttemptsError() {
  return (
    <section className="border-2 border-[#FF3C38] bg-[#FFFDF8] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 h-5 w-5 text-[#FF3C38]" />
        <div>
          <p className="font-display text-3xl leading-none text-[#211F20]">
            Results could not be loaded
          </p>
          <p className="mt-2 q-body text-[#211F20]">
            The quiz editor is still available. Refresh the page to try loading
            attempts again.
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

function AttemptStatusBadge({ status }: { status: AdminAttemptListItem["status"] }) {
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
      {isSubmitted ? "Submitted" : "In progress"}
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

function formatDuration(totalSeconds?: number) {
  if (typeof totalSeconds !== "number") {
    return "In progress";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not submitted";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
