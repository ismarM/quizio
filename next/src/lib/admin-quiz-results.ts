import "server-only";

import { ServerFetchError, serverFetchJson } from "@/lib/serverFetch";
import type {
  AttemptResultResponse,
  QuestionDTO,
  QuizAttemptDTO,
  QuizAttemptsResponse,
} from "@/lib/types";
import type {
  AdminAttemptListItem,
  AdminAttemptQuestionReview,
  AdminAttemptReview,
  AdminAttemptStatus,
} from "@/lib/admin-quiz-result-types";

export const adminQuizResultEndpoints = {
  attempts: (quizId: string | number) => `/api/quizzes/${quizId}/attempts/admin`,
  attemptReview: (quizId: string | number, userId: string | number) =>
    `/api/quizzes/${quizId}/attempt/${userId}`,
};

export async function loadAdminQuizAttemptList(quizId: string | number) {
  const data = await serverFetchJson<QuizAttemptsResponse>(
    adminQuizResultEndpoints.attempts(quizId)
  );

  return data.attempts;
}

export async function loadAdminQuizAttemptReviews(quizId: string | number) {
  const attempts = await loadAdminQuizAttemptList(quizId);
  const reviews = await Promise.all(
    attempts.map(async (attempt) => {
      const result = await serverFetchJson<AttemptResultResponse>(
        adminQuizResultEndpoints.attemptReview(quizId, attempt.user_id)
      );

      return buildAdminAttemptReview(result, attempt);
    })
  );

  return reviews.map(toAdminAttemptListItem);
}

export async function loadAdminQuizAttemptReview(
  quizId: string | number,
  userId: string | number
) {
  const [attempts, result] = await Promise.all([
    loadAdminQuizAttemptList(quizId).catch((error) => {
      if (error instanceof ServerFetchError && error.status === 404) {
        return [];
      }
      throw error;
    }),
    serverFetchJson<AttemptResultResponse>(
      adminQuizResultEndpoints.attemptReview(quizId, userId)
    ),
  ]);

  const matchingAttempt = attempts.find(
    (attempt) => String(attempt.user_id) === String(userId)
  );

  return buildAdminAttemptReview(result, matchingAttempt);
}

function buildAdminAttemptReview(
  result: AttemptResultResponse,
  attempt?: QuizAttemptDTO
): AdminAttemptReview {
  const responseMap = new Map(
    result.responses.map((response) => [response.question_id, response.answer_id])
  );

  const questions = result.questions.map((question) =>
    buildQuestionReview(question, responseMap.get(question.id))
  );

  const score = questions.reduce((sum, question) => sum + question.earnedPoints, 0);
  const maxScore = questions.reduce((sum, question) => sum + question.maxPoints, 0);
  const correctAnswers = questions.filter((question) => question.isCorrect).length;
  const timeTakenSeconds =
    attempt?.time_taken_seconds ?? result.attempt.time_taken_seconds;
  const status: AdminAttemptStatus =
    typeof timeTakenSeconds === "number" ? "submitted" : "in_progress";

  return {
    quizId: result.quiz.id,
    quizTitle: result.quiz.title,
    userId: attempt?.user_id ?? result.attempt.user_id,
    userEmail: attempt?.user_email ?? `User #${result.attempt.user_id}`,
    attemptId: attempt?.id_attempt ?? result.attempt.id,
    status,
    startedAt: result.attempt.start_time,
    submittedAt:
      typeof timeTakenSeconds === "number"
        ? getSubmittedAt(result.attempt.start_time, timeTakenSeconds)
        : undefined,
    timeTakenSeconds,
    score,
    maxScore,
    correctAnswers,
    totalQuestions: result.questions.length,
    questions,
  };
}

function buildQuestionReview(
  question: QuestionDTO,
  selectedAnswerId?: number
): AdminAttemptQuestionReview {
  const selectedAnswer = question.answers.find(
    (answer) => answer.id === selectedAnswerId
  );
  const correctAnswers = question.answers.filter((answer) => answer.is_correct);
  const isCorrect = Boolean(
    selectedAnswer &&
      correctAnswers.some((answer) => answer.id === selectedAnswer.id)
  );

  return {
    id: question.id,
    title: question.title,
    maxPoints: question.value,
    earnedPoints: isCorrect ? question.value : 0,
    selectedAnswer,
    correctAnswers,
    isCorrect,
  };
}

function getSubmittedAt(startedAt: string, timeTakenSeconds: number) {
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) {
    return undefined;
  }
  return new Date(start.getTime() + timeTakenSeconds * 1000).toISOString();
}

function toAdminAttemptListItem(
  review: AdminAttemptReview
): AdminAttemptListItem {
  return {
    attemptId: review.attemptId,
    userId: review.userId,
    userEmail: review.userEmail,
    status: review.status,
    startedAt: review.startedAt,
    submittedAt: review.submittedAt,
    timeTakenSeconds: review.timeTakenSeconds,
    score: review.score,
    maxScore: review.maxScore,
    correctAnswers: review.correctAnswers,
    totalQuestions: review.totalQuestions,
  };
}
