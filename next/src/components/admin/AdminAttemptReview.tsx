import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Mail,
  Timer,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isImageUrl } from "@/lib/admin-quiz-assets";
import type {
  AdminAttemptQuestionReview,
  AdminAttemptReview as AdminAttemptReviewModel,
} from "@/lib/admin-quiz-result-types";
import { routes } from "@/lib/routes";

type AdminAttemptReviewProps = {
  review: AdminAttemptReviewModel;
};

export function AdminAttemptReview({ review }: AdminAttemptReviewProps) {
  const percentage =
    review.maxScore > 0
      ? Math.round((review.score / review.maxScore) * 100)
      : 0;

  return (
    <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
      <div className="mb-6 flex">
        <Button
          asChild
          className="q-button q-button-secondary rounded-none border-[#211F20] bg-[#FFFAF2] text-[#211F20] shadow-[4px_4px_0_#211F20] hover:bg-[#EBE4D8]"
          variant="outline"
        >
          <Link href={routes.adminQuizResults(review.quizId)}>
            <ArrowLeft data-icon="inline-start" />
            Back to results
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            Attempt review
          </p>
          <h1 className="font-display text-[54px] leading-[0.9] text-[#211F20] md:text-[86px]">
            {review.quizTitle}
          </h1>
          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            Review the submitted answers, scoring and timing details for this
            user.
          </p>
        </div>

        <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[6px_6px_0_#211F20] md:min-w-[260px]">
          <Trophy className="mb-4 h-10 w-10 text-[#006E5A]" />
          <p className="q-mini text-[#211F20]">Final score</p>
          <p className="font-display text-[58px] leading-none text-[#FF3C38]">
            {percentage}%
          </p>
          <p className="mt-1 q-body text-[#211F20]">
            {formatScore(review.score, review.maxScore)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid content-start gap-5">
          <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="q-mini text-[#8F8F8F]">User</p>
                <p className="mt-1 break-all font-display text-3xl leading-none text-[#211F20]">
                  {review.userEmail}
                </p>
              </div>
              <AttemptStatusBadge status={review.status} />
            </div>

            <Separator className="my-5 h-[2px] bg-[#211F20]" />

            <div className="grid gap-3">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="User ID"
                value={`#${review.userId}`}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={review.userEmail}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label="Started"
                value={formatDateTime(review.startedAt)}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label="Submitted"
                value={formatDateTime(review.submittedAt)}
              />
              <InfoRow
                icon={<Timer className="h-4 w-4" />}
                label="Duration"
                value={formatDuration(review.timeTakenSeconds)}
              />
            </div>
          </section>

          <section className="border-2 border-[#006E5A] bg-[#DDECE8] p-5">
            <p className="font-display text-3xl leading-none text-[#211F20]">
              Result summary
            </p>
            <div className="mt-4 grid gap-3">
              <SummaryStat
                label="Correct answers"
                value={`${review.correctAnswers}/${review.totalQuestions}`}
              />
              <SummaryStat
                label="Points"
                value={formatScore(review.score, review.maxScore)}
              />
              <SummaryStat label="Attempt ID" value={`#${review.attemptId}`} />
            </div>
          </section>
        </aside>

        <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                Answers
              </p>
              <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                Question review
              </h2>
            </div>
            <Badge
              className="w-fit rounded-none border-0 bg-[#EBE4D8] px-3 py-1 text-[12px] leading-4 text-[#211F20]"
              variant="secondary"
            >
              {review.questions.length} questions
            </Badge>
          </div>

          <Separator className="my-5 h-[2px] bg-[#211F20]" />

          <div className="grid gap-4">
            {review.questions.map((question, index) => (
              <QuestionReviewCard
                index={index}
                key={question.id}
                question={question}
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export function AdminAttemptReviewLoading() {
  return (
    <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="grid gap-3">
          <div className="h-8 w-32 animate-pulse bg-[#EBE4D8]" />
          <div className="h-20 max-w-2xl animate-pulse bg-[#EBE4D8]" />
          <div className="h-6 max-w-xl animate-pulse bg-[#EBE4D8]" />
        </div>
        <div className="h-44 animate-pulse border-2 border-[#211F20] bg-[#EBE4D8]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="h-96 animate-pulse border-2 border-[#211F20] bg-[#FFFAF2]" />
        <div className="grid gap-4 border-2 border-[#211F20] bg-[#FFFAF2] p-5">
          {[1, 2, 3].map((item) => (
            <div
              className="h-40 animate-pulse border border-[#D7D0C4] bg-[#EBE4D8]"
              key={item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionReviewCard({
  index,
  question,
}: {
  index: number;
  question: AdminAttemptQuestionReview;
}) {
  return (
    <article
      className={[
        "border-2 bg-[#FFFDF8] p-4",
        question.isCorrect ? "border-[#006E5A]" : "border-[#FF3C38]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="q-mini text-[#8F8F8F]">Question {index + 1}</p>
          <h3 className="mt-1 font-display text-3xl leading-none text-[#211F20]">
            {question.title}
          </h3>
        </div>

        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center border-2",
            question.isCorrect
              ? "border-[#006E5A] bg-[#DDECE8] text-[#006E5A]"
              : "border-[#FF3C38] bg-[#FF3C38] text-[#FFFAF2]",
          ].join(" ")}
          title={question.isCorrect ? "Correct" : "Incorrect"}
        >
          {question.isCorrect ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_150px]">
        <AnswerPanel
          label="Selected answer"
          tone={question.isCorrect ? "correct" : "wrong"}
          value={question.selectedAnswer?.title ?? "Not answered"}
        />
        <AnswerPanel
          label={
            question.correctAnswers.length > 1
              ? "Correct answers"
              : "Correct answer"
          }
          tone="correct"
          value={question.correctAnswers.map((answer) => answer.title)}
        />
        <div className="border border-[#EBE4D8] bg-[#FFFAF2] p-3">
          <p className="q-mini text-[#8F8F8F]">Points</p>
          <p className="mt-2 font-display text-3xl leading-none text-[#211F20]">
            {formatScore(question.earnedPoints, question.maxPoints)}
          </p>
        </div>
      </div>
    </article>
  );
}

function AnswerPanel({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "correct" | "wrong";
  value: string | string[];
}) {
  const values = Array.isArray(value) ? value : [value];
  const displayValues = values.length > 0 ? values : ["Unknown"];

  return (
    <div
      className={[
        "border bg-[#FFFAF2] p-3",
        tone === "correct" ? "border-[#006E5A]" : "border-[#FF3C38]",
      ].join(" ")}
    >
      <p className="q-mini text-[#8F8F8F]">{label}</p>
      <div className="mt-2 grid gap-2">
        {displayValues.map((item, index) => (
          <AnswerValue key={`${item}-${index}`} value={item} />
        ))}
      </div>
    </div>
  );
}

function AnswerValue({ value }: { value: string }) {
  if (isImageUrl(value)) {
    return (
      <div className="grid gap-2">
        <div
          aria-label="Answer image"
          className="min-h-[130px] border border-[#D7D0C4] bg-[#EBE4D8] bg-contain bg-center bg-no-repeat"
          role="img"
          style={{ backgroundImage: `url("${value}")` }}
        />
        <p className="q-mini text-[#8F8F8F]">Image answer</p>
      </div>
    );
  }

  return (
    <p className="font-display text-2xl leading-none text-[#211F20]">
      {value}
    </p>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 border border-[#EBE4D8] bg-[#FFFDF8] p-3">
      <span className="row-span-2 text-[#006E5A]">{icon}</span>
      <p className="q-mini text-[#8F8F8F]">{label}</p>
      <p className="break-all text-[14px] font-semibold leading-5 text-[#211F20]">
        {value}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#006E5A] pb-3 last:border-b-0">
      <p className="q-mini text-[#211F20]">{label}</p>
      <p className="font-display text-3xl leading-none text-[#211F20]">
        {value}
      </p>
    </div>
  );
}

function AttemptStatusBadge({ status }: { status: AdminAttemptReviewModel["status"] }) {
  const isSubmitted = status === "submitted";

  return (
    <Badge
      className={[
        "shrink-0 rounded-none border-0 px-2 py-1 text-[12px] leading-4",
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

function formatScore(score: number, maxScore: number) {
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
