"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Flag } from "lucide-react";
import { useRouter } from "next/navigation";

import { buildProxyUrl, proxyFetchJson } from "@/lib/proxyClient";
import { isImageUrl } from "@/lib/admin-quiz-assets";
import { routes } from "@/lib/routes";
import type {
  AttemptQuestionDTO,
  QuestionDTO,
  UpdateAttemptRequest,
} from "@/lib/types";

type AttemptPlayerProps = {
  quizId: number;
  quizTitle: string;
  questions: QuestionDTO[];
  responses: AttemptQuestionDTO[];
  initialTimeLeftSeconds: number;
};

export function AttemptPlayer({
  quizId,
  quizTitle,
  questions,
  responses,
  initialTimeLeftSeconds,
}: AttemptPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    responses.forEach((response) => {
      initial[response.question_id] = response.answer_id;
    });
    return initial;
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    initialTimeLeftSeconds
  );
  const isFinishingRef = useRef(false);

  const finishAttempt = useCallback(async () => {
    if (isFinishingRef.current) {
      return;
    }

    isFinishingRef.current = true;

    try {
      await proxyFetchJson(`/quizzes/${quizId}/attempts/finish`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to finish attempt:", error);
    } finally {
      router.push(routes.attemptResult(quizId));
      router.refresh();
    }
  }, [quizId, router]);

  useEffect(() => {
    if (initialTimeLeftSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeftSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [initialTimeLeftSeconds]);

  useEffect(() => {
    if (timeLeftSeconds === 0) {
      void finishAttempt();
    }
  }, [finishAttempt, timeLeftSeconds]);

  useEffect(() => {
    const handleUnload = () => {
      if (isFinishingRef.current) {
        return;
      }

      isFinishingRef.current = true;
      const url = buildProxyUrl(`/quizzes/${quizId}/attempts/finish`);
      navigator.sendBeacon(url);
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [quizId]);

  const currentQuestion = questions[currentIndex];
  const selectedOptionId = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const progressPercent = useMemo(() => {
    if (questions.length === 0) {
      return 0;
    }
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  async function selectAnswer(optionId: number) {
    if (!currentQuestion) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionId,
    }));

    const payload: UpdateAttemptRequest = {
      updates: [
        {
          question_id: currentQuestion.id,
          answer_id: optionId,
        },
      ],
    };

    try {
      await proxyFetchJson(`/quizzes/${quizId}/attempts`, {
        method: "PATCH",
        body: payload,
      });
    } catch (error) {
      console.error("Failed to update attempt:", error);
    }
  }

  function goPrevious() {
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    setCurrentIndex((value) => Math.min(questions.length - 1, value + 1));
  }

  return (
    <section className="q-container pb-10 pt-6 md:pb-16 md:pt-10">
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[8px_8px_0_#EBE4D8] md:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="q-mini text-[#8F8F8F]">
                Question {currentIndex + 1} / {questions.length}
              </p>
              <h1 className="mt-1 font-display text-[36px] leading-none text-[#211F20] md:text-[48px]">
                {quizTitle}
              </h1>
            </div>

            <div className="flex h-10 items-center gap-2 border-2 border-[#211F20] px-3 font-display text-xl text-[#211F20]">
              <Clock3 className="h-4 w-4 text-[#006E5A]" />
              {formatTimeLeft(timeLeftSeconds)}
            </div>
          </div>

          <div className="mb-8 h-2 bg-[#EBE4D8]">
            <div
              className="h-full bg-[#FF3C38]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex bg-[#DDECE8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
              Single choice
            </span>
            <span className="inline-flex bg-[#EBE4D8] px-2 py-1 text-[12px] leading-4 text-[#211F20]">
              {currentQuestion?.value ?? 0} points
            </span>
          </div>

          {currentQuestion ? (
            <h2 className="font-display text-[46px] leading-[0.95] text-[#211F20] md:text-[64px]">
              {currentQuestion.title}
            </h2>
          ) : (
            <h2 className="font-display text-[46px] leading-[0.95] text-[#211F20] md:text-[64px]">
              No questions available.
            </h2>
          )}

          <div className="mt-8 grid gap-3">
            {currentQuestion
              ? currentQuestion.answers.map((option) => {
              const isSelected = selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectAnswer(option.id)}
                  className={[
                    "flex min-h-14 items-center gap-3 border-2 px-4 text-left transition hover:border-[#211F20]",
                    isSelected
                      ? "border-[#FF3C38] bg-[#FFFAF2]"
                      : "border-[#D7D0C4] bg-[#FFFAF2]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center border-2",
                      isSelected
                        ? "border-[#FF3C38] bg-[#FF3C38]"
                        : "border-[#8F8F8F]",
                    ].join(" ")}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4 text-[#FFFAF2]" strokeWidth={3} />
                    ) : null}
                  </span>

                  <AnswerOptionContent value={option.title} />
                </button>
              );
            })
              : null}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
          <button
              type="button"
              onClick={() => {
                if (currentIndex > 0) {
                  goPrevious();
                }
              }}
              className={[
                "q-button q-button-secondary",
                currentIndex === 0 ? "pointer-events-none opacity-40" : "",
              ].join(" ")}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
          </button>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => void finishAttempt()}
                className="q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]"
              >
                <Flag className="h-4 w-4" />
                Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="border-2 border-[#211F20] bg-[#EBE4D8] p-5">
            <p className="font-display text-[38px] leading-none text-[#211F20]">
              Attempt progress
            </p>

            <div className="my-4 h-[2px] bg-[#211F20]" />

            <p className="q-body text-[#211F20]">
              Answered{" "}
              <strong className="text-[#006E5A]">{answeredCount}</strong> of{" "}
              <strong>{questions.length}</strong> questions.
            </p>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = answers[question.id] !== undefined;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={[
                      "flex h-10 items-center justify-center border-2 font-display text-xl",
                      isCurrent
                        ? "border-[#FF3C38] bg-[#FF3C38] text-[#FFFAF2]"
                        : isAnswered
                          ? "border-[#006E5A] bg-[#DDECE8] text-[#006E5A]"
                          : "border-[#211F20] bg-[#FFFAF2] text-[#211F20]",
                    ].join(" ")}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2]">
            <p className="font-display text-[38px] leading-none">
              Timer keeps running.
            </p>
            <p className="mt-3 q-body">
              Closing the browser does not pause the quiz. Submit before the
              time runs out.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AnswerOptionContent({ value }: { value: string }) {
  if (!isImageUrl(value)) {
    return <span className="q-body text-[#211F20]">{value}</span>;
  }

  return (
    <span className="grid flex-1 gap-2">
      <span
        aria-label="Answer image"
        className="min-h-[160px] w-full border border-[#D7D0C4] bg-[#EBE4D8] bg-contain bg-center bg-no-repeat"
        role="img"
        style={{ backgroundImage: `url("${value}")` }}
      />
      <span className="q-mini text-[#8F8F8F]">Image answer</span>
    </span>
  );
}

function formatTimeLeft(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
