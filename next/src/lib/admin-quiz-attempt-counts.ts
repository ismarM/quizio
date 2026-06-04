import { ServerFetchError, serverFetchJson } from "@/lib/serverFetch";
import type {
  LeaderboardResponse,
  QuizAttemptsResponse,
  QuizDTO,
} from "@/lib/types";

export async function loadQuizAttemptCounts(quizzes: Pick<QuizDTO, "id">[]) {
  const entries = await Promise.all(
    quizzes.map(async (quiz) => [
      quiz.id,
      await loadQuizAttemptCount(quiz.id),
    ] as const)
  );

  return new Map(entries);
}

export async function loadQuizAttemptCount(quizId: number | string) {
  try {
    const data = await serverFetchJson<QuizAttemptsResponse>(
      `/api/quizzes/${quizId}/attempts/admin`
    );
    return data.attempts.length;
  } catch (error) {
    if (error instanceof ServerFetchError) {
      if (error.status === 401 || error.status === 403) {
        return loadLeaderboardEntryCount(quizId);
      }
      return 0;
    }
    throw error;
  }
}

async function loadLeaderboardEntryCount(quizId: number | string) {
  try {
    const data = await serverFetchJson<LeaderboardResponse>(
      `/api/quizzes/${quizId}/leaderboard`
    );
    return data.entries.length;
  } catch (error) {
    if (error instanceof ServerFetchError) {
      return 0;
    }
    throw error;
  }
}
