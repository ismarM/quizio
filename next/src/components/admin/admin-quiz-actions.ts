import type { AdminQuizListItem } from "@/components/admin/data/quiz-mappers";
import { proxyFetchJson } from "@/lib/api/proxy-client";
import type { QuizResponse } from "@/lib/types";

type QuizPublishPayload = {
  publish_date?: string;
};

function parseDatetimeLocalValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function validateScheduledPublish(value: string) {
  const date = parseDatetimeLocalValue(value);

  if (!date) {
    return "missing";
  }

  if (date.getTime() <= Date.now()) {
    return "past";
  }

  return date;
}

export async function publishQuizNow(quiz: AdminQuizListItem) {
  const body: QuizPublishPayload = {
    publish_date: new Date(Date.now() - 1000).toISOString(),
  };

  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/publish`, {
    method: "PATCH",
    body,
  });
}

export async function scheduleQuizRelease(
  quiz: AdminQuizListItem,
  publishDate: string
) {
  const body: QuizPublishPayload = { publish_date: publishDate };

  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/publish`, {
    method: "PATCH",
    body,
  });
}

export function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

export async function archiveQuiz(quiz: AdminQuizListItem) {
  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/archive`, {
    method: "PATCH",
    body: { is_archived: true },
  });
}
