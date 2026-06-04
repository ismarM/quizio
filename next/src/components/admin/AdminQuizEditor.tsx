"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Clock3,
  Eye,
  FilePlus2,
  ImagePlus,
  ListChecks,
  LockKeyhole,
  Save,
  Shuffle,
  Trash2,
} from "lucide-react";

import { isImageUrl, uploadImageFile } from "@/lib/uploads/images";
import type { AdminQuizDetail } from "@/components/admin/data/quiz-mappers";
import { proxyFetchJson } from "@/lib/api/proxy-client";
import { routes } from "@/lib/navigation/routes";
import type { CategoryDTO, QuestionDTO, QuizResponse } from "@/lib/types";

type AdminQuizEditorProps = {
  categories: CategoryDTO[];
  quiz: AdminQuizDetail;
};

type EditableAnswer = {
  id: string;
  originalId?: number;
  text: string;
  isCorrect: boolean;
};

type EditableQuestion = {
  id: string;
  originalId?: number;
  title: string;
  points: string;
  answers: EditableAnswer[];
};

type QuizMetadataPayload = {
  title: string;
  description?: string;
  category_id?: number;
  image_url?: string;
  time_limit_seconds: number;
};

export function AdminQuizEditor({ categories, quiz }: AdminQuizEditorProps) {
  const router = useRouter();
  const isDraftEditable =
    quiz.status === "draft" || quiz.status === "scheduled";
  const isLocked = quiz.status === "published" || quiz.status === "archived";
  const hasReleaseTime = quiz.status === "scheduled";

  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description);
  const [categoryId, setCategoryId] = useState(() =>
    quiz.categoryId ? String(quiz.categoryId) : categories[0] ? String(categories[0].id) : ""
  );
  const [timeLimit, setTimeLimit] = useState(String(quiz.timeLimitMinutes));
  const [thumbnailUrl, setThumbnailUrl] = useState(quiz.imageUrl);
  const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
    quiz.questions.map((question) => ({
      id: String(question.id),
      originalId: question.id,
      title: question.title,
      points: String(question.points),
      answers: question.answers.map((answer) => ({
        id: String(answer.id),
        originalId: answer.id,
        text: answer.title,
        isCorrect: answer.isCorrect,
      })),
    }))
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const validationErrors = getValidationErrors({ title, timeLimit, questions });
  const isValid = validationErrors.length === 0;

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()]);
  }

  function updateQuestion(id: string, updates: Partial<EditableQuestion>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...updates } : question
      )
    );
  }

  function removeQuestion(id: string) {
    setQuestions((current) => current.filter((question) => question.id !== id));
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    setQuestions((current) => {
      const index = current.findIndex((question) => question.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function shuffleQuestions() {
    setQuestions((current) => {
      const next = [...current];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [next[index], next[target]] = [next[target], next[index]];
      }
      return next;
    });
  }

  function addAnswer(questionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, answers: [...question.answers, createAnswer(false)] }
          : question
      )
    );
  }

  function updateAnswer(
    questionId: string,
    answerId: string,
    updates: Partial<EditableAnswer>
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answers: question.answers.map((answer) =>
                answer.id === answerId ? { ...answer, ...updates } : answer
              ),
            }
          : question
      )
    );
  }

  function removeAnswer(questionId: string, answerId: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || question.answers.length <= 2) {
          return question;
        }

        const nextAnswers = question.answers.filter(
          (answer) => answer.id !== answerId
        );

        if (!nextAnswers.some((answer) => answer.isCorrect)) {
          nextAnswers[0] = { ...nextAnswers[0], isCorrect: true };
        }

        return { ...question, answers: nextAnswers };
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

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadingTarget("thumbnail");
    try {
      const data = await uploadImageFile(file);
      setThumbnailUrl(data.url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload thumbnail";
      setUploadError(message);
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleAnswerImageUpload(
    questionId: string,
    answerId: string,
    file: File | undefined
  ) {
    if (!file) {
      return;
    }

    const target = `${questionId}:${answerId}`;
    setUploadError(null);
    setUploadingTarget(target);
    try {
      const data = await uploadImageFile(file);
      updateAnswer(questionId, answerId, { text: data.url });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload answer image";
      setUploadError(message);
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setStatusMessage(null);

    if (!isDraftEditable) {
      setSubmitError("This quiz can no longer be edited here.");
      return;
    }

    if (!isValid) {
      setSubmitError(validationErrors[0] ?? "Please complete all required fields.");
      return;
    }

    const payload = buildUpdatePayload({
      title,
      description,
      categoryId,
      thumbnailUrl,
      timeLimit,
    });

    if (!payload) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    const createdQuestionIds: number[] = [];
    try {
      await proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}`, {
        method: "PUT",
        body: payload,
      });

      for (const question of questions) {
        const created = await proxyFetchJson<QuestionDTO>(
          `/quizzes/${quiz.id}/questions`,
          {
            method: "POST",
            body: buildQuestionPayload(question),
          }
        );
        createdQuestionIds.push(created.id);
      }

      for (const question of quiz.questions) {
        await proxyFetchJson(`/questions/${question.id}`, {
          method: "DELETE",
        });
      }

      setStatusMessage("Changes saved.");
      router.refresh();
    } catch (error) {
      for (const questionId of createdQuestionIds) {
        await proxyFetchJson(`/questions/${questionId}`, {
          method: "DELETE",
        }).catch(() => null);
      }

      const message =
        error instanceof Error ? error.message : "Failed to save changes";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        className="border-2 border-[#211F20] bg-[#FFFAF2] p-4 shadow-[4px_4px_0_#EBE4D8] md:p-5"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.admin}
            className="inline-flex items-center gap-2 q-mini text-[#211F20] hover:text-[#FF3C38]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to admin
          </Link>

          <StatusBadge status={quiz.status} />
        </div>

        {isLocked ? (
          <div className="mb-5 border-2 border-[#006E5A] bg-[#DDECE8] p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 h-5 w-5 text-[#006E5A]" />
              <div>
                <p className="font-display text-2xl leading-none text-[#211F20]">
                  Quiz is locked
                </p>
                <p className="mt-1 q-body text-[#211F20]">
                  Published or archived quizzes cannot be changed.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {hasReleaseTime ? (
          <div className="mb-5 border-2 border-[#DDECE8] bg-[#F5FBF9] p-4">
            <p className="font-display text-2xl leading-none text-[#211F20]">
              Release time is managed from the admin list
            </p>
            <p className="mt-1 q-body text-[#211F20]">
              Change the exact release time on the main admin page.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5">
          <FormField label="Quiz title" required>
            <input
              className="q-input h-12"
              disabled={!isDraftEditable}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className="min-h-[140px] w-full border-2 border-[#211F20] bg-[#FFFAF2] p-3 q-body outline-none focus:border-[#FF3C38] disabled:opacity-60"
              disabled={!isDraftEditable}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Category">
              <select
                className="q-input h-12"
                disabled={!isDraftEditable || categories.length === 0}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Time limit" required>
              <div className="relative">
                <Clock3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
                <input
                  className="q-input h-12 pl-10"
                  disabled={!isDraftEditable}
                  min="1"
                  type="number"
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(event.target.value)}
                />
              </div>
            </FormField>
          </div>

          <FormField label="Thumbnail image">
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <ImagePreview label="Quiz thumbnail" value={thumbnailUrl} />

              <div className="grid content-start gap-3">
                <input
                  className="q-input h-12"
                  disabled={!isDraftEditable}
                  placeholder="Paste image URL or upload a file"
                  value={thumbnailUrl}
                  onChange={(event) => setThumbnailUrl(event.target.value)}
                />

                <label
                  className={[
                    "q-button q-button-secondary w-fit cursor-pointer border-[#006E5A] text-[#006E5A] hover:bg-[#006E5A] hover:text-[#FFFAF2]",
                    !isDraftEditable ? "pointer-events-none opacity-50" : "",
                  ].join(" ")}
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploadingTarget === "thumbnail" ? "Uploading..." : "Upload image"}
                  <input
                    className="sr-only"
                    accept="image/*"
                    disabled={!isDraftEditable}
                    type="file"
                    onChange={(event) => {
                      void handleThumbnailUpload(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </FormField>

          <section className="border-2 border-[#211F20] bg-white p-4 shadow-[4px_4px_0_#EBE4D8]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex bg-[#EBE4D8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
                  Questions
                </p>
                <p className="mt-2 font-display text-3xl leading-none text-[#211F20]">
                  Edit question order
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={shuffleQuestions}
                  className="q-button q-button-secondary border-[#006E5A] text-[#006E5A] hover:bg-[#006E5A] hover:text-[#FFFAF2]"
                  disabled={!isDraftEditable || questions.length < 2}
                >
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </button>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="q-button q-button-primary border-[#006E5A] bg-[#006E5A]"
                  disabled={!isDraftEditable}
                >
                  <FilePlus2 className="h-4 w-4" />
                  Add question
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {questions.map((question, index) => (
                <article
                  key={question.id}
                  className="border-2 border-[#D7D0C4] bg-[#FFFDF8] p-4 shadow-[3px_3px_0_#EBE4D8]"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-2xl text-[#211F20]">
                      Question {index + 1}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, -1)}
                        className="q-button q-button-secondary"
                        disabled={!isDraftEditable || index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                        Up
                      </button>

                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 1)}
                        className="q-button q-button-secondary"
                        disabled={!isDraftEditable || index === questions.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                        Down
                      </button>

                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="q-button q-button-secondary border-[#FF3C38] text-[#FF3C38] hover:bg-[#FF3C38] hover:text-[#FFFAF2]"
                        disabled={!isDraftEditable || questions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <FormField label="Question text" required>
                      <input
                        className="q-input h-12"
                        disabled={!isDraftEditable}
                        value={question.title}
                        onChange={(event) =>
                          updateQuestion(question.id, { title: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Points" required>
                      <input
                        className="q-input h-12"
                        disabled={!isDraftEditable}
                        min="1"
                        type="number"
                        value={question.points}
                        onChange={(event) =>
                          updateQuestion(question.id, { points: event.target.value })
                        }
                      />
                    </FormField>

                    <div className="grid gap-3">
                      <p className="font-display text-2xl leading-none text-[#211F20]">
                        Answers
                      </p>

                      {question.answers.map((answer, answerIndex) => (
                        <div
                          key={answer.id}
                          className="grid gap-3 border border-[#EBE4D8] bg-[#FFFAF2] p-3 md:grid-cols-[auto_1fr_auto] md:items-start"
                        >
                          <label className="flex items-center gap-2 q-mini text-[#211F20]">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={answer.isCorrect}
                              disabled={!isDraftEditable}
                              onChange={() =>
                                setCorrectAnswer(question.id, answer.id)
                              }
                            />
                            Correct
                          </label>

                          <div className="grid gap-2">
                            <input
                              className="q-input h-12"
                              disabled={!isDraftEditable}
                              value={answer.text}
                              onChange={(event) =>
                                updateAnswer(question.id, answer.id, {
                                  text: event.target.value,
                                })
                              }
                              placeholder={`Answer ${answerIndex + 1} text or image URL`}
                            />

                            {isImageUrl(answer.text) ? (
                              <ImagePreview
                                label={`Answer ${answerIndex + 1}`}
                                value={answer.text}
                              />
                            ) : null}

                            <label
                              className={[
                                "q-button q-button-secondary w-fit cursor-pointer border-[#006E5A] text-[#006E5A] hover:bg-[#006E5A] hover:text-[#FFFAF2]",
                                !isDraftEditable
                                  ? "pointer-events-none opacity-50"
                                  : "",
                              ].join(" ")}
                            >
                              <ImagePlus className="h-4 w-4" />
                              {uploadingTarget === `${question.id}:${answer.id}`
                                ? "Uploading..."
                                : "Use image"}
                              <input
                                className="sr-only"
                                accept="image/*"
                                disabled={!isDraftEditable}
                                type="file"
                                onChange={(event) => {
                                  void handleAnswerImageUpload(
                                    question.id,
                                    answer.id,
                                    event.target.files?.[0]
                                  );
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAnswer(question.id, answer.id)}
                            className="q-button q-button-secondary border-[#FF3C38] text-[#FF3C38] hover:bg-[#FF3C38] hover:text-[#FFFAF2]"
                            disabled={!isDraftEditable || question.answers.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addAnswer(question.id)}
                        className="q-button q-button-primary w-fit border-[#211F20] bg-[#211F20]"
                        disabled={!isDraftEditable}
                      >
                        <FilePlus2 className="h-4 w-4" />
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
              type="submit"
              className={[
                "q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]",
                !isDraftEditable || !isValid || isSubmitting
                  ? "pointer-events-none opacity-50"
                  : "",
              ].join(" ")}
              disabled={!isDraftEditable || !isValid || isSubmitting}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>

            <Link href={routes.quizDetail(quiz.id)} className="q-button q-button-secondary">
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </div>

          {submitError ? (
            <p className="q-mini text-[#FF3C38]">{submitError}</p>
          ) : null}

          {uploadError ? (
            <p className="q-mini text-[#FF3C38]">{uploadError}</p>
          ) : null}

          {statusMessage ? (
            <p className="q-mini text-[#006E5A]">{statusMessage}</p>
          ) : null}
        </div>
      </form>

      <aside className="grid content-start gap-5 lg:sticky lg:top-24">
        <section className="border-2 border-[#211F20] bg-[#EBE4D8] p-5">
          <ListChecks className="mb-5 h-10 w-10 text-[#006E5A]" />

          <p className="font-display text-[34px] leading-none text-[#211F20]">
            Quiz summary
          </p>

          <div className="my-5 h-[2px] bg-[#211F20]" />

          <div className="grid gap-3">
            <SummaryItem label="Questions" value={`${questions.length}`} />
            <SummaryItem label="Time limit" value={`${timeLimit} min`} />
            <SummaryItem label="Created" value={quiz.createdAt} />
            <SummaryItem label="Release time" value={quiz.publishAtLabel} />
          </div>
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
    <div className="block">
      <span className="mb-2 block font-display text-2xl leading-none text-[#211F20]">
        {label}
        {required ? <span className="text-[#FF3C38]"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#211F20] pb-3 last:border-b-0">
      <p className="q-mini text-[#211F20]">{label}</p>
      <p className="font-display text-3xl leading-none text-[#211F20]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminQuizDetail["status"] }) {
  const label =
    status === "published"
      ? "published"
      : status === "archived"
      ? "archived"
      : "draft";
  const classes = {
    draft: "bg-[#EBE4D8] text-[#211F20]",
    published: "bg-[#006E5A] text-[#FFFAF2]",
    archived: "bg-[#8F8F8F] text-[#FFFAF2]",
  };

  return (
    <span className={`px-2 py-1 text-[12px] leading-4 ${classes[label]}`}>
      {label}
    </span>
  );
}

function ImagePreview({ label, value }: { label: string; value: string }) {
  if (!isImageUrl(value)) {
    return (
      <div className="flex min-h-[132px] items-center justify-center border-2 border-[#D7D0C4] bg-[#EBE4D8] p-4 text-center q-mini text-[#211F20]">
        No image selected
      </div>
    );
  }

  return (
    <div
      aria-label={label}
      className="min-h-[132px] border-2 border-[#211F20] bg-[#EBE4D8] bg-contain bg-center bg-no-repeat"
      role="img"
      style={{ backgroundImage: `url("${value}")` }}
    />
  );
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createAnswer(isCorrect: boolean): EditableAnswer {
  return {
    id: createId(),
    text: "",
    isCorrect,
  };
}

function createQuestion(): EditableQuestion {
  return {
    id: createId(),
    title: "",
    points: "5",
    answers: [createAnswer(true), createAnswer(false)],
  };
}

function getValidationErrors({
  title,
  timeLimit,
  questions,
}: {
  title: string;
  timeLimit: string;
  questions: EditableQuestion[];
}) {
  const errors: string[] = [];
  if (!title.trim()) {
    errors.push("Title is required.");
  }
  if (Number(timeLimit) <= 0) {
    errors.push("Time limit must be at least 1 minute.");
  }
  if (questions.length === 0) {
    errors.push("Add at least one question.");
  }

  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.title.trim()) {
      errors.push(`${label} needs a title.`);
    }
    if (Number(question.points) <= 0) {
      errors.push(`${label} needs positive points.`);
    }
    if (question.answers.length < 2) {
      errors.push(`${label} needs at least 2 answers.`);
    }
    if (!question.answers.some((answer) => answer.isCorrect)) {
      errors.push(`${label} needs a correct answer.`);
    }
    if (question.answers.some((answer) => !answer.text.trim())) {
      errors.push(`${label} has empty answers.`);
    }
  });

  return errors;
}

function buildUpdatePayload({
  title,
  description,
  categoryId,
  thumbnailUrl,
  timeLimit,
}: {
  title: string;
  description: string;
  categoryId: string;
  thumbnailUrl: string;
  timeLimit: string;
}): QuizMetadataPayload | null {
  const timeLimitSeconds = Math.round(Number(timeLimit) * 60);
  if (!title.trim() || timeLimitSeconds <= 0) {
    return null;
  }

  return {
    title: title.trim(),
    description: description.trim() ? description.trim() : undefined,
    category_id: Number(categoryId) > 0 ? Number(categoryId) : undefined,
    image_url: thumbnailUrl.trim() ? thumbnailUrl.trim() : undefined,
    time_limit_seconds: timeLimitSeconds,
  };
}

function buildQuestionPayload(question: EditableQuestion) {
  return {
    title: question.title.trim(),
    value: Number(question.points),
    answers: question.answers.map((answer) => ({
      title: answer.text.trim(),
      is_correct: answer.isCorrect,
    })),
  };
}
