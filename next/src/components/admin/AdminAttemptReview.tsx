import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  Check,
  Clock3,
  Timer,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isImageUrl } from "@/lib/uploads/images";
import type {
  AdminAttemptQuestionReview,
  AdminAttemptReview as AdminAttemptReviewModel,
} from "@/components/admin/data/quiz-result-types";
import {
  formatDateTimeLabel,
  formatDurationClock,
  formatScoreFraction,
} from "@/lib/formatting/quiz-results";
import { routes } from "@/lib/navigation/routes";

type AdminAttemptReviewProps = {
  review: AdminAttemptReviewModel;
};

type AdminAttemptReviewLabels = {
  answerImage: string;
  answers: string;
  attemptId: string;
  attemptReview: string;
  backToResults: string;
  correct: string;
  correctAnswer: string;
  correctAnswers: string;
  correctAnswersStat: string;
  duration: string;
  finalScore: string;
  imageAnswer: string;
  incorrect: string;
  inProgress: string;
  intro: string;
  notAnswered: string;
  notSubmitted: string;
  points: string;
  question: (number: number) => string;
  questionCount: (count: number) => string;
  questionReview: string;
  resultSummary: string;
  selectedAnswer: string;
  started: string;
  submitted: string;
  submittedStatus: string;
  unknown: string;
  user: string;
  userId: string;
  username: string;
};

export async function AdminAttemptReview({ review }: AdminAttemptReviewProps) {
  const t = await getTranslations("admin.attemptReview");
  const locale = await getLocale();
  const labels = createAdminAttemptReviewLabels(t);
  const percentage =
    review.maxScore > 0
      ? Math.round((review.score / review.maxScore) * 100)
      : 0;

  return (
    <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
      <div className="mb-6 flex">
        <Button
          asChild
          className="q-button q-button-secondary h-11 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[16px] text-[#211F20] shadow-[4px_4px_0_#EBE4D8] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] hover:text-[#211F20]"
          variant="outline"
        >
          <Link href={routes.adminQuizResults(review.quizId)}>
            <ArrowLeft data-icon="inline-start" />
            {labels.backToResults}
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {labels.attemptReview}
          </p>
          <h1 className="font-display text-[54px] leading-[0.9] text-[#211F20] md:text-[86px]">
            {review.quizTitle}
          </h1>
          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            {labels.intro}
          </p>
        </div>

        <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[6px_6px_0_#211F20] md:min-w-[260px]">
          <Trophy className="mb-4 h-10 w-10 text-[#006E5A]" />
          <p className="q-mini text-[#211F20]">{labels.finalScore}</p>
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
                <p className="q-mini text-[#8F8F8F]">{labels.user}</p>
                <p className="mt-1 break-all font-display text-3xl leading-none text-[#211F20]">
                  {review.userName}
                </p>
              </div>
              <AttemptStatusBadge labels={labels} status={review.status} />
            </div>

            <Separator className="my-5 h-[2px] bg-[#211F20]" />

            <div className="grid gap-3">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label={labels.userId}
                value={`#${review.userId}`}
              />
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label={labels.username}
                value={review.userName}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label={labels.started}
                value={formatDateTime(review.startedAt, locale, labels)}
              />
              <InfoRow
                icon={<Clock3 className="h-4 w-4" />}
                label={labels.submitted}
                value={formatDateTime(review.submittedAt, locale, labels)}
              />
              <InfoRow
                icon={<Timer className="h-4 w-4" />}
                label={labels.duration}
                value={formatDuration(review.timeTakenSeconds, labels)}
              />
            </div>
          </section>

          <section className="border-2 border-[#006E5A] bg-[#DDECE8] p-5">
            <p className="font-display text-3xl leading-none text-[#211F20]">
              {labels.resultSummary}
            </p>
            <div className="mt-4 grid gap-3">
              <SummaryStat
                label={labels.correctAnswersStat}
                value={`${review.correctAnswers}/${review.totalQuestions}`}
              />
              <SummaryStat
                label={labels.points}
                value={formatScore(review.score, review.maxScore)}
              />
              <SummaryStat label={labels.attemptId} value={`#${review.attemptId}`} />
            </div>
          </section>
        </aside>

        <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                {labels.answers}
              </p>
              <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                {labels.questionReview}
              </h2>
            </div>
            <Badge
              className="w-fit rounded-none border-0 bg-[#EBE4D8] px-3 py-1 text-[12px] leading-4 text-[#211F20]"
              variant="secondary"
            >
              {labels.questionCount(review.questions.length)}
            </Badge>
          </div>

          <Separator className="my-5 h-[2px] bg-[#211F20]" />

          <div className="grid gap-4">
            {review.questions.map((question, index) => (
              <QuestionReviewCard
                index={index}
                key={question.id}
                labels={labels}
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
  labels,
  question,
}: {
  index: number;
  labels: AdminAttemptReviewLabels;
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
          <p className="q-mini text-[#8F8F8F]">{labels.question(index + 1)}</p>
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
          title={question.isCorrect ? labels.correct : labels.incorrect}
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
          imageAnswerLabel={labels.imageAnswer}
          label={labels.selectedAnswer}
          tone={question.isCorrect ? "correct" : "wrong"}
          value={question.selectedAnswer?.title ?? labels.notAnswered}
        />
        <AnswerPanel
          imageAnswerLabel={labels.imageAnswer}
          label={
            question.correctAnswers.length > 1
              ? labels.correctAnswers
              : labels.correctAnswer
          }
          tone="correct"
          value={question.correctAnswers.map((answer) => answer.title)}
        />
        <div className="border border-[#EBE4D8] bg-[#FFFAF2] p-3">
          <p className="q-mini text-[#8F8F8F]">{labels.points}</p>
          <p className="mt-2 font-display text-3xl leading-none text-[#211F20]">
            {formatScore(question.earnedPoints, question.maxPoints)}
          </p>
        </div>
      </div>
    </article>
  );
}

function AnswerPanel({
  imageAnswerLabel,
  label,
  tone,
  value,
}: {
  imageAnswerLabel: string;
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
          <AnswerValue
            imageAnswerLabel={imageAnswerLabel}
            key={`${item}-${index}`}
            value={item}
          />
        ))}
      </div>
    </div>
  );
}

function AnswerValue({
  imageAnswerLabel,
  value,
}: {
  imageAnswerLabel: string;
  value: string;
}) {
  if (isImageUrl(value)) {
    return (
      <div className="grid gap-2">
        <div
          aria-label={imageAnswerLabel}
          className="min-h-[130px] border border-[#D7D0C4] bg-[#EBE4D8] bg-contain bg-center bg-no-repeat"
          role="img"
          style={{ backgroundImage: `url("${value}")` }}
        />
        <p className="q-mini text-[#8F8F8F]">{imageAnswerLabel}</p>
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

function AttemptStatusBadge({
  labels,
  status,
}: {
  labels: AdminAttemptReviewLabels;
  status: AdminAttemptReviewModel["status"];
}) {
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
      {isSubmitted ? labels.submittedStatus : labels.inProgress}
    </Badge>
  );
}

function formatScore(score: number, maxScore: number) {
  return formatScoreFraction(score, maxScore);
}

function formatDuration(totalSeconds: number | undefined, labels: AdminAttemptReviewLabels) {
  return formatDurationClock(totalSeconds, labels.inProgress);
}

function formatDateTime(
  value: string | undefined,
  locale: string,
  labels: AdminAttemptReviewLabels
) {
  return formatDateTimeLabel({
    fallback: labels.notSubmitted,
    locale,
    options: {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    unknownLabel: labels.unknown,
    value,
  });
}

function createAdminAttemptReviewLabels(
  t: (key: string, values?: Record<string, number>) => string
): AdminAttemptReviewLabels {
  return {
    answerImage: t("answerImage"),
    answers: t("answers"),
    attemptId: t("attemptId"),
    attemptReview: t("attemptReview"),
    backToResults: t("backToResults"),
    correct: t("correct"),
    correctAnswer: t("correctAnswer"),
    correctAnswers: t("correctAnswers"),
    correctAnswersStat: t("correctAnswersStat"),
    duration: t("duration"),
    finalScore: t("finalScore"),
    imageAnswer: t("imageAnswer"),
    incorrect: t("incorrect"),
    inProgress: t("inProgress"),
    intro: t("intro"),
    notAnswered: t("notAnswered"),
    notSubmitted: t("notSubmitted"),
    points: t("points"),
    question: (number) => t("question", { number }),
    questionCount: (count) => t("questionCount", { count }),
    questionReview: t("questionReview"),
    resultSummary: t("resultSummary"),
    selectedAnswer: t("selectedAnswer"),
    started: t("started"),
    submitted: t("submitted"),
    submittedStatus: t("submittedStatus"),
    unknown: t("unknown"),
    user: t("user"),
    userId: t("userId"),
    username: t("username"),
  };
}
