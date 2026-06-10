import Link from "next/link";
import {
    ArrowLeft,
    Check,
    Trophy,
    X,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { isImageUrl } from "@/lib/uploads/images";
import { routes } from "@/lib/navigation/routes";
import type { AttemptResultResponse } from "@/lib/types";

type AttemptResultProps = {
    result: AttemptResultResponse;
}

export async function AttemptResult({ result }: AttemptResultProps) {
    const t = await getTranslations("attemptResult");
    const locale = await getLocale();
    const summary = buildResultSummary(result, t, locale);
    const percentage = summary.maxScore > 0
        ? Math.round((summary.totalScore / summary.maxScore) * 100)
        : 0;

    return (
        <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
            <div className="grid gap-8">
                <div className="q-result-enter border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[8px_8px_0_#211F20] md:p-8">
                    <Link
                        href={routes.quizzes}
                        className="q-button q-button-secondary mb-6 h-11 w-fit border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[16px] shadow-[3px_3px_0_#D7D0C4] transition hover:-translate-y-0.5 hover:bg-[#FFFDF8] hover:text-[#211F20]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("backToQuizzes")}
                    </Link>

                    <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
                        <div className="flex min-h-[260px] items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2]">
                            <div className="text-center">
                                <div className="q-result-trophy mx-auto flex h-32 w-32 items-center justify-center bg-[#DDECE8]">
                                <Trophy
                                    className="h-20 w-20 text-[#006E5A]"
                                    strokeWidth={1.7}
                                />
                                </div>

                                <p className="q-result-score mt-6 font-display text-[64px] leading-none text-[#FF3C38]">
                                {percentage}%
                                </p>

                                <p className="mt-2 q-body text-[#211F20]">
                                {t("finalQuizResult")}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 inline-flex bg-[#FFFAF2] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                                {t("result")}
                            </p>

                            <h1 className="font-display text-[58px] leading-[0.9] text-[#211F20] md:text-[92px]">
                                {t("quizCompleted")}
                            </h1>

                            <p className="mt-5 max-w-2xl text-[18px] leading-7 text-[#211F20]">
                                {t.rich("completedBody", {
                                    quizTitle: summary.quizTitle,
                                    strong: (chunks) => <strong>{chunks}</strong>,
                                })}
                            </p>

                            <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                <StatBox
                                    label={t("score")}
                                    value={`${summary.totalScore}/${summary.maxScore}`}
                                />
                                <StatBox
                                    label={t("correct")}
                                    value={`${summary.correctAnswers}/${summary.totalQuestions}`}
                                />
                                <StatBox label={t("time")} value={summary.timeTaken} />
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
                                <Link
                                href={routes.quizzes}
                                className="q-button q-button-primary h-12 border-[#FF3C38] bg-[#FF3C38] px-5 text-[17px]"
                                >
                                {t("exploreMoreQuizzes")}
                                </Link>
                                <Link
                                href={routes.quizLeaderboard(result.quiz.id)}
                                className="q-button q-button-secondary h-12 px-5 text-[17px]"
                                >
                                {t("viewLeaderboard")}
                                </Link>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid items-start gap-6 md:grid-cols-[minmax(220px,0.58fr)_1.42fr]">
                    <aside className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2] md:p-6">
                        <Trophy className="mb-6 h-12 w-12" strokeWidth={1.8} />

                        <p className="font-display text-[38px] leading-[0.9] md:text-[44px]">
                            {t("niceAttempt")}
                        </p>

                        <p className="mt-4 text-[15px] leading-6">
                            {t("reviewBody")}
                        </p>

                        <div className="mt-6 border-2 border-[#FFFAF2] p-4">
                            <p className="q-mini">{t("submitted")}</p>
                            <p className="font-display text-2xl">{summary.submittedAt}</p>
                        </div>
                    </aside>

                    <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                                {t("review")}
                                </p>
                                <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                                {t("yourAnswers")}
                                </h2>
                            </div>

                            <span className="q-badge-green">{t("graded")}</span>
                        </div>

                        <div className="h-[2px] bg-[#211F20]" />

                        <div className="mt-4 grid gap-3">
                            {summary.answers.map((answer, index) => (
                                <AnswerReview
                                    correctLabel={t("correct")}
                                    imageAnswerLabel={t("imageAnswer")}
                                    index={index}
                                    key={`${answer.question}-${index}`}
                                    pointsLabel={t("points")}
                                    questionLabel={t("question", { number: index + 1 })}
                                    selectedLabel={t("selected")}
                                    {...answer}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
            </section>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-2 border-[#211F20] bg-[#FFFAF2] p-4">
            <p className="q-mini text-">{label}</p>
            <p className="mt-1 font-display text-[42px] leading-none text-[#211F20]">
                {value}
            </p>
        </div>
    );
}

function AnswerReview({
    index,
    question,
    selected,
    correct,
    isCorrect,
    points,
    correctLabel,
    imageAnswerLabel,
    pointsLabel,
    questionLabel,
    selectedLabel,
}: {
    question: string;
    selected: string;
    correct: string;
    index: number;
    isCorrect: boolean;
    points: number;
    correctLabel: string;
    imageAnswerLabel: string;
    pointsLabel: string;
    questionLabel: string;
    selectedLabel: string;
}) {
    return (
        <article
            className="q-result-answer border border-[#D7D0C4] bg-[#FFFAF2] p-4"
            style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="q-mini text-[#8F8F8F]">{questionLabel}</p>
                    <h3 className="mt-1 font-display text-2xl leading-none text-[#211F20]">
                        {question}
                    </h3>
                </div>

                <span
                    className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center border-2",
                        isCorrect
                        ? "border-[#006E5A] bg-[#DDECE8] text-[#006E5A]"
                        : "border-[#FF3C38] bg-[#FF3C38] text-[#FFFAF2]",
                    ].join(" ")}
                >
                {isCorrect ? (
                    <Check className="h-5 w-5" />
                ) : (
                    <X className="h-5 w-5" />
                )}
                </span>
            </div>

            <div className="mt-4 grid gap-2 text-[14px] leading-5 md:grid-cols-3">
                <ResultLine imageAnswerLabel={imageAnswerLabel} label={selectedLabel} value={selected} />
                <ResultLine imageAnswerLabel={imageAnswerLabel} label={correctLabel} value={correct} />
                <ResultLine imageAnswerLabel={imageAnswerLabel} label={pointsLabel} value={`${points}`} />
            </div>
        </article>
    );
}

function ResultLine({
    imageAnswerLabel,
    label,
    value,
}: {
    imageAnswerLabel: string;
    label: string;
    value: string;
}) {
    return (
      <div className="border border-[#EBE4D8] p-3">
        <p className="q-mini text-[#8F8F8F]">{label}</p>
        {isImageUrl(value) ? (
          <div className="mt-2 grid gap-2">
            <div
              aria-label={`${label} image`}
              className="min-h-[120px] border border-[#D7D0C4] bg-[#EBE4D8] bg-contain bg-center bg-no-repeat"
              role="img"
              style={{ backgroundImage: `url("${value}")` }}
            />
            <p className="q-mini text-[#8F8F8F]">{imageAnswerLabel}</p>
          </div>
        ) : (
          <p className="font-display text-xl leading-none text-[#211F20]">
            {value}
          </p>
        )}
      </div>
    );
}

type AnswerSummary = {
    question: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
    points: number;
};

type ResultSummary = {
    quizTitle: string;
    totalScore: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    timeTaken: string;
    submittedAt: string;
    answers: AnswerSummary[];
};

function buildResultSummary(
    result: AttemptResultResponse,
    t: (key: string) => string,
    locale: string
): ResultSummary {
    const responseMap = new Map(
        result.responses.map((response) => [response.question_id, response.answer_id])
    );

    let totalScore = 0;
    let correctAnswers = 0;
    const answers: AnswerSummary[] = result.questions.map((question) => {
        const selectedId = responseMap.get(question.id);
        const selectedAnswer = question.answers.find((answer) => answer.id === selectedId);
        const correctAnswer = question.answers.find((answer) => answer.is_correct);
        const isCorrect = Boolean(selectedAnswer && correctAnswer && selectedAnswer.id === correctAnswer.id);
        const points = isCorrect ? question.value : 0;

        if (isCorrect) {
            totalScore += question.value;
            correctAnswers += 1;
        }

        return {
            question: question.title,
            selected: selectedAnswer?.title ?? t("notAnswered"),
            correct: correctAnswer?.title ?? t("unknown"),
            isCorrect,
            points,
        };
    });

    const maxScore = result.questions.reduce((sum, question) => sum + question.value, 0);
    const totalQuestions = result.questions.length;
    const timeTakenSeconds = result.attempt.time_taken_seconds ?? 0;

    return {
        quizTitle: result.quiz.title,
        totalScore,
        maxScore,
        correctAnswers,
        totalQuestions,
        timeTaken: formatDuration(timeTakenSeconds),
        submittedAt: formatDate(result.attempt, timeTakenSeconds, locale, t("unknown")),
        answers,
    };
}

function formatDuration(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.max(0, totalSeconds % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(
    attempt: AttemptResultResponse["attempt"],
    timeTakenSeconds: number,
    locale: string,
    fallback: string
) {
    const start = new Date(attempt.start_time);
    if (Number.isNaN(start.getTime())) {
        return fallback;
    }
    const submitted = new Date(start.getTime() + timeTakenSeconds * 1000);
    return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
    }).format(submitted);
}
