import { proxyFetchJson } from "@/lib/proxyClient";
import type { QuizFullResponse, QuizResponse } from "@/lib/types";

export type QuizMetadataPayload = {
  title: string;
  description?: string;
  category_id?: number;
  image_url?: string;
  time_limit_seconds: number;
};

export type QuizCreatePayload = QuizMetadataPayload & {
  questions: Array<{
    title: string;
    value: number;
    answers: Array<{
      title: string;
      is_correct: boolean;
    }>;
  }>;
};

export type QuizPublishPayload = {
  publish_date?: string;
};

export async function replaceLockedQuiz(
  quizId: number,
  payload: QuizCreatePayload,
  publishBody?: QuizPublishPayload
) {
  const replacement = await proxyFetchJson<QuizFullResponse>("/quizzes", {
    method: "POST",
    body: {
      ...payload,
      title: makeTemporaryQuizTitle(payload.title, quizId),
    },
  });

  let originalDeleted = false;

  try {
    await proxyFetchJson<void>(`/quizzes/${quizId}`, {
      method: "DELETE",
    });
    originalDeleted = true;

    await proxyFetchJson<QuizResponse>(`/quizzes/${replacement.quiz.id}`, {
      method: "PUT",
      body: toMetadataPayload(payload),
    });

    if (publishBody) {
      await proxyFetchJson<QuizResponse>(
        `/quizzes/${replacement.quiz.id}/publish`,
        {
          method: "PATCH",
          body: publishBody,
        }
      );
    }
  } catch (error) {
    if (!originalDeleted) {
      await proxyFetchJson<void>(`/quizzes/${replacement.quiz.id}`, {
        method: "DELETE",
      }).catch(() => null);
    }
    throw error;
  }

  return replacement;
}

export function buildCreateQuizPayloadFromFullQuiz(
  data: QuizFullResponse
): QuizCreatePayload {
  return {
    title: data.quiz.title.trim(),
    description: data.quiz.description?.trim() || undefined,
    category_id: data.quiz.category_id,
    image_url: data.quiz.image_url?.trim() || undefined,
    time_limit_seconds: data.quiz.time_limit_seconds ?? 0,
    questions: data.questions.map((question) => ({
      title: question.title,
      value: question.value,
      answers: question.answers.map((answer) => ({
        title: answer.title,
        is_correct: Boolean(answer.is_correct),
      })),
    })),
  };
}

function toMetadataPayload(payload: QuizCreatePayload): QuizMetadataPayload {
  return {
    title: payload.title,
    description: payload.description,
    category_id: payload.category_id,
    image_url: payload.image_url,
    time_limit_seconds: payload.time_limit_seconds,
  };
}

function makeTemporaryQuizTitle(title: string, quizId: number) {
  const suffix = ` [copy-${quizId}-${Date.now()}]`;
  return `${title.slice(0, 255 - suffix.length)}${suffix}`;
}
