"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FilePlus2,
  Info,
  Save,
} from "lucide-react";

import { routes } from "@/lib/routes";

const categories = [
  "Science",
  "Geography",
  "History",
  "Math",
  "Technology",
  "Literature",
  "Arts",
];

export function AdminQuizForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Science");
  const [timeLimit, setTimeLimit] = useState("15");
  const [opensAt, setOpensAt] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [
    createQuestion(),
  ]);

  const isValid = title.trim().length > 0 && Number(timeLimit) > 0;

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()]);
  }

  function updateQuestion(id: string, updates: Partial<DraftQuestion>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...updates } : question
      )
    );
  }

  function removeQuestion(id: string) {
    setQuestions((current) => current.filter((question) => question.id !== id));
  }

  function addAnswer(questionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answers: [...question.answers, createAnswer(false)],
            }
          : question
      )
    );
  }

  function updateAnswer(
    questionId: string,
    answerId: string,
    updates: Partial<DraftAnswer>
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        return {
          ...question,
          answers: question.answers.map((answer) =>
            answer.id === answerId ? { ...answer, ...updates } : answer
          ),
        };
      })
    );
  }

  function removeAnswer(questionId: string, answerId: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        if (question.answers.length <= 2) {
          return question;
        }

        const nextAnswers = question.answers.filter(
          (answer) => answer.id !== answerId
        );

        if (!nextAnswers.some((answer) => answer.isCorrect)) {
          nextAnswers[0] = { ...nextAnswers[0], isCorrect: true };
        }

        return {
          ...question,
          answers: nextAnswers,
        };
      })
    );
  }

  function setCorrectAnswer(questionId: string, answerId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answers: question.answers.map((answer) => ({
                ...answer,
                isCorrect: answer.id === answerId,
              })),
            }
          : question
      )
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <form className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[8px_8px_0_#EBE4D8] md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.adminQuizzes}
            className="inline-flex items-center gap-2 q-mini text-[#211F20] hover:text-[#FF3C38]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quizzes
          </Link>

          <span className="bg-[#EBE4D8] px-2 py-1 text-[12px] leading-4 text-[#211F20]">
            Draft
          </span>
        </div>

        <div className="grid gap-5">
          <FormField label="Quiz title" required>
            <input
              className="q-input h-12"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Science Fundamentals"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className="min-h-[140px] w-full border-2 border-[#211F20] bg-[#FFFAF2] p-3 q-body outline-none focus:border-[#FF3C38]"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Shortly explain what this quiz is about..."
            />
          </FormField>

          <div className="grid gap-5 md:grid-cols-3">
            <FormField label="Category">
              <select
                className="q-input h-12"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Time limit" required>
              <div className="relative">
                <Clock3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
                <input
                  className="q-input h-12 pl-10"
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(event.target.value)}
                  type="number"
                  min="1"
                  placeholder="15"
                />
              </div>
            </FormField>

            <FormField label="Opens at">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
                <input
                  className="q-input h-12 pl-10"
                  value={opensAt}
                  onChange={(event) => setOpensAt(event.target.value)}
                  type="datetime-local"
                />
              </div>
            </FormField>
          </div>

          <div className="border-2 border-[#EBE4D8] bg-[#FFFAF2] p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-1 h-5 w-5 text-[#006E5A]" />
              <div>
                <p className="font-display text-2xl leading-none text-[#211F20]">
                  Build the quiz in one go
                </p>
                <p className="mt-1 q-body text-[#211F20]">
                  You can add questions and answers while creating the quiz or
                  come back later to refine them.
                </p>
              </div>
            </div>
          </div>

          <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex bg-[#EBE4D8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
                  Questions
                </p>
                <p className="mt-2 font-display text-3xl leading-none text-[#211F20]">
                  Add questions now
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="q-button q-button-secondary"
              >
                <FilePlus2 className="h-4 w-4" />
                Add question
              </button>
            </div>

            <div className="grid gap-4">
              {questions.map((question, index) => (
                <article
                  key={question.id}
                  className="border-2 border-[#D7D0C4] bg-[#FFFAF2] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-2xl text-[#211F20]">
                      Question {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="q-button q-button-secondary"
                      disabled={questions.length <= 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <FormField label="Question text" required>
                      <input
                        className="q-input h-12"
                        value={question.title}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            title: event.target.value,
                          })
                        }
                        placeholder="Example: Which planet is known as the Red Planet?"
                      />
                    </FormField>

                    <FormField label="Points" required>
                      <input
                        className="q-input h-12"
                        value={question.points}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            points: event.target.value,
                          })
                        }
                        type="number"
                        min="1"
                      />
                    </FormField>

                    <div className="grid gap-3">
                      <p className="font-display text-2xl leading-none text-[#211F20]">
                        Answers
                      </p>

                      {question.answers.map((answer, answerIndex) => (
                        <div
                          key={answer.id}
                          className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center"
                        >
                          <label className="flex items-center gap-2 q-mini text-[#211F20]">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={answer.isCorrect}
                              onChange={() =>
                                setCorrectAnswer(question.id, answer.id)
                              }
                            />
                            Correct
                          </label>

                          <input
                            className="q-input h-12"
                            value={answer.text}
                            onChange={(event) =>
                              updateAnswer(question.id, answer.id, {
                                text: event.target.value,
                              })
                            }
                            placeholder={`Answer ${answerIndex + 1}`}
                          />

                          <button
                            type="button"
                            onClick={() => removeAnswer(question.id, answer.id)}
                            className="q-button q-button-secondary"
                            disabled={question.answers.length <= 2}
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addAnswer(question.id)}
                        className="q-button q-button-secondary w-fit"
                      >
                        Add answer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              className={[
                "q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]",
                !isValid ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              <Save className="h-4 w-4" />
              Save draft
            </button>

            <Link href={routes.adminQuizzes} className="q-button q-button-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </form>

      <aside className="grid content-start gap-5">
        <section className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 md:p-6">
          <FilePlus2 className="mb-5 h-10 w-10 text-[#006E5A]" />

          <p className="font-display text-[42px] leading-[0.9] text-[#211F20]">
            Quiz setup checklist
          </p>

          <div className="my-5 h-[2px] bg-[#211F20]" />

          <div className="grid gap-3 q-body text-[#211F20]">
            <ChecklistItem done={title.trim().length > 0} text="Add title" />
            <ChecklistItem done={description.trim().length > 0} text="Add description" />
            <ChecklistItem done={Number(timeLimit) > 0} text="Set time limit" />
            <ChecklistItem done={questions.length > 0} text="Add questions" />
            <ChecklistItem done={false} text="Publish when ready" />
          </div>
        </section>

        <section className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2] md:p-6">
          <p className="font-display text-[38px] leading-[0.9]">
            Published quizzes lock editing.
          </p>
          <p className="mt-4 q-body">
            Keep drafts editable. After publishing, question and answer changes
            should be locked to protect results.
          </p>
        </section>
      </aside>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-display text-2xl leading-none text-[#211F20]">
        {label}
        {required ? <span className="text-[#FF3C38]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={[
          "flex h-5 w-5 items-center justify-center border-2",
          done
            ? "border-[#006E5A] bg-[#006E5A]"
            : "border-[#211F20] bg-[#FFFAF2]",
        ].join(" ")}
      >
        {done ? <span className="h-2 w-2 bg-[#FFFAF2]" /> : null}
      </span>
      <span>{text}</span>
    </div>
  );
}

type DraftAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  id: string;
  title: string;
  points: string;
  answers: DraftAnswer[];
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createAnswer(isCorrect: boolean): DraftAnswer {
  return {
    id: createId(),
    text: "",
    isCorrect,
  };
}

function createQuestion(): DraftQuestion {
  return {
    id: createId(),
    title: "",
    points: "5",
    answers: [createAnswer(true), createAnswer(false)],
  };
}