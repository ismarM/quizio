import Link from "next/link";
import {
    ArrowLeft,
    Check,
    Clock3,
    ListChecks,
    Trophy,
    X,
} from "lucide-react";

import { mockAttemptResult } from "@/lib/mock-data";
import { routes } from "@/lib/routes";

type AttemptResultProps = {
    attemptId: number;
}

export function AttemptResult({ attemptId }: AttemptResultProps) {
    const result = {
        ...mockAttemptResult,
        attemptId,
    };

    const percentage = Math.round((result.totalScore / result.maxScore) * 100);

    return (
        <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
            <div className="grid gap-8">
                <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[8px_8px_0_#211F20] md:p-8">
                    <Link
                        href={routes.quizzes}
                        className="mb-6 inline-flex items-center gap-2 q-mini text-[#211F20] hover:text-[#FF3C38]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to quizzes
                    </Link>

                    <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
                        <div className="flex min-h-[260px] items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2]">
                            <div className="text-center">
                                <div className="mx-auto flex h-32 w-32 items-center justify-center bg-[#DDECE8]">
                                <Trophy
                                    className="h-20 w-20 text-[#006E5A]"
                                    strokeWidth={1.7}
                                />
                                </div>

                                <p className="mt-6 font-display text-[64px] leading-none text-[#FF3C38]">
                                {percentage}%
                                </p>

                                <p className="mt-2 q-body text-[#211F20]">
                                Final quiz result
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 inline-flex bg-[#FFFAF2] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                                Result
                            </p>

                            <h1 className="font-display text-[58px] leading-[0.9] text-[#211F20] md:text-[92px]">
                                Quiz completed.
                            </h1>

                            <p className="mt-5 max-w-2xl text-[18px] leading-7 text-[#211F20]">
                                You finished <strong>{result.quizTitle}</strong>. Your score is
                                saved and can be shown on the quiz leaderboard.
                            </p>

                            <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                <StatBox
                                    label="Score"
                                    value={`${result.totalScore}/${result.maxScore}`}
                                />
                                <StatBox
                                    label="Correct"
                                    value={`${result.correctAnswers}/${result.totalQuestions}`}
                                />
                                <StatBox label="Time" value={result.timeTaken} />
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
                                <Link
                                href={routes.quizzes}
                                className="q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                                >
                                Explore more quizzes
                                </Link>

                                <Link
                                href={routes.dashboard}
                                className="q-button q-button-secondary"
                                >
                                Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                    <aside className="border-2 border-[#211F20] bg-[#006E5A] p-6 text-[#FFFAF2]">
                        <Trophy className="mb-6 h-12 w-12" strokeWidth={1.8} />

                        <p className="font-display text-[48px] leading-[0.9]">
                            Nice attempt.
                        </p>

                        <p className="mt-4 q-body">
                            Review your answers below. Correct answers earn points, incorrect
                            answers are shown clearly.
                        </p>

                        <div className="mt-6 border-2 border-[#FFFAF2] p-4">
                            <p className="q-mini">Submitted</p>
                            <p className="font-display text-3xl">{result.submittedAt}</p>
                        </div>
                    </aside>

                    <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                                Review
                                </p>
                                <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                                Your answers
                                </h2>
                            </div>

                            <span className="q-badge-green">Graded</span>
                        </div>

                        <div className="h-[2px] bg-[#211F20]" />

                        <div className="mt-4 grid gap-3">
                            {result.answers.map((answer, index) => (
                                <AnswerReview key={answer.question} index={index} {...answer} />
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
}: {
    index: number;
    question: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
    points: number;
}) {
    return (
        <article className="border border-[#D7D0C4] bg-[#FFFAF2] p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="q-mini text-[#8F8F8F]">Question {index + 1}</p>
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
                <ResultLine label="Selected" value={selected} />
                <ResultLine label="Correct" value={correct} />
                <ResultLine label="Points" value={`${points}`} />
            </div>
        </article>
    );
}

function ResultLine({ label, value }: { label: string; value: string }) {
    return (
      <div className="border border-[#EBE4D8] p-3">
        <p className="q-mini text-[#8F8F8F]">{label}</p>
        <p className="font-display text-xl leading-none text-[#211F20]">
          {value}
        </p>
      </div>
    );
}