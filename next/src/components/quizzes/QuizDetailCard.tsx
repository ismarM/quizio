import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ListChecks,
  Play,
} from "lucide-react";

import type { QuizListItem } from "@/lib/types";
import { routes } from "@/lib/navigation/routes";
import { isImageUrl } from "@/lib/uploads/images";

type QuizDetailCardProps = {
  quiz: QuizListItem;
  isLoggedIn: boolean;
  resultSummary?: QuizResultSummary;
};

export function QuizDetailCard({
  quiz,
  isLoggedIn,
  resultSummary,
}: QuizDetailCardProps) {
  const t = useTranslations("quizDetail");
  const hasResult = Boolean(resultSummary);

  return (
    <section className="border-2 border-[#211F20] bg-[#FFFAF2]">
      <div className="relative border-b-2 border-[#211F20] bg-[#EBE4D8] p-5 md:p-7">
        <Link
          href={routes.quizzes}
          className="mb-5 inline-flex items-center gap-2 q-body text-[#211F20] hover:text-[#FF3C38]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToQuizzes")}
        </Link>

        {isImageUrl(quiz.image) ? (
          <div
            aria-label={`${quiz.title} thumbnail`}
            className="min-h-[260px] border-2 border-[#211F20] bg-[#FFFAF2] bg-cover bg-center md:min-h-[340px]"
            role="img"
            style={{ backgroundImage: `url("${quiz.image}")` }}
          />
        ) : (
          <div className="flex min-h-[260px] items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] md:min-h-[340px]">
            <div className="text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center bg-[#DDECE8] md:h-36 md:w-36">
                <ListChecks
                  className="h-16 w-16 text-[#006E5A] md:h-20 md:w-20"
                  strokeWidth={1.8}
                />
              </div>

              <p className="mt-6 font-display text-[42px] leading-none text-[#211F20] md:text-[64px]">
                {quiz.category}
              </p>

              <p className="mx-auto mt-3 max-w-md q-body text-[#211F20]">
                {t("readyLabel")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex bg-[#DDECE8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
              {quiz.category}
            </span>

            <span className="q-badge-green">{t("published")}</span>
          </div>

          <h1 className="mt-4 font-display text-[58px] leading-[0.9] text-[#211F20] md:text-[92px]">
            {quiz.title}
          </h1>

          <p className="mt-5 max-w-2xl text-[18px] leading-7 text-[#211F20]">
            {quiz.description}
          </p>

          <div className="my-6 h-[2px] bg-[#211F20]" />

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox
              icon={<ListChecks className="h-5 w-5" />}
              label={t("questionsLabel")}
              value={`${quiz.questionCount}`}
              suffix={t("questionsSuffix")}
            />
            <InfoBox
              icon={<Clock3 className="h-5 w-5" />}
              label={t("timeLimitLabel")}
              value={`${quiz.timeLimitMinutes}`}
              suffix={t("minutesSuffix")}
            />
            <InfoBox
              icon={<CalendarDays className="h-5 w-5" />}
              label={t("opensLabel")}
              value={quiz.opensAt}
              suffix=""
            />
          </div>
        </div>

        <aside className="grid content-center gap-4">
          {hasResult ? (
            <div className="border-2 border-[#006E5A] bg-[#DDECE8] p-4">
              <p className="font-display text-2xl text-[#211F20]">
                {t("completed")}
              </p>
              <p className="mt-1 q-body text-[#211F20]">
                {t("score")}: <strong>{resultSummary?.scoreText}</strong> · {resultSummary?.percentage}%
              </p>
              <div className="mt-3 grid gap-2 q-mini text-[#211F20]">
                <span>{t("timeTaken")}: {resultSummary?.timeTaken}</span>
                <span>{t("submitted")}: {resultSummary?.submittedAt}</span>
              </div>
            </div>
          ) : null}

          <div className="border-2 border-[#EBE4D8] bg-[#FFFAF2] p-4">
            <p className="font-display text-2xl text-[#211F20]">
              {t("quizRules")}
            </p>

            <div className="mt-3 grid gap-3 q-body text-[#211F20]">
              <RuleItem text={t("ruleTimer")} />
              <RuleItem text={t("ruleSaved")} />
              <RuleItem text={t("ruleLeaderboard")} />
            </div>
          </div>

          <div className="grid gap-3">
            {hasResult ? (
              <Link
                href={routes.attemptResult(quiz.id)}
                className="q-button q-button-secondary h-14 w-full items-center justify-center"
              >
                {t("viewResult")}
              </Link>
            ) : (
              <Link
                href={isLoggedIn ? routes.attempt(quiz.id) : `${routes.login}?next=${routes.attempt(quiz.id)}`}
                className="q-button q-button-primary h-14 w-full items-center justify-center gap-[3px] border-[#FF3C38] bg-[#FF3C38] text-lg"
              >
                <Play className="h-6 w-6" />
                {t("startQuiz")}
              </Link>
            )}

            {hasResult ? (
              <button
                type="button"
                className="q-button q-button-secondary h-12 w-full opacity-60"
                disabled
              >
                {t("alreadyCompleted")}
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function InfoBox({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="border-2 border-[#EBE4D8] bg-[#FFFAF2] p-4">
      <div className="mb-3 flex items-center gap-2 text-[#006E5A]">
        {icon}
        <span className="q-mini text-[#8F8F8F]">{label}</span>
      </div>

      <div className="flex items-end gap-2">
        <p className="font-display text-[42px] leading-none text-[#211F20]">
          {value}
        </p>
        {suffix ? (
          <p className="pb-1 q-mini text-[#8F8F8F]">{suffix}</p>
        ) : null}
      </div>
    </div>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-2 h-2 w-2 rotate-45 bg-[#006E5A]" />
      <span>{text}</span>
    </div>
  );
}

type QuizResultSummary = {
  scoreText: string;
  percentage: number;
  timeTaken: string;
  submittedAt: string;
};
