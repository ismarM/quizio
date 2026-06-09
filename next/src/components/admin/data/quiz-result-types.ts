import type { AnswerDTO } from "@/lib/types";

export type AdminAttemptStatus = "submitted" | "in_progress";

export type AdminAttemptQuestionReview = {
  id: number;
  title: string;
  maxPoints: number;
  earnedPoints: number;
  selectedAnswer?: AnswerDTO;
  correctAnswers: AnswerDTO[];
  isCorrect: boolean;
};

export type AdminAttemptReview = {
  quizId: number;
  quizTitle: string;
  userId: number;
  userEmail: string;
  userName: string;
  attemptId: number;
  status: AdminAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  questions: AdminAttemptQuestionReview[];
};

export type AdminAttemptListItem = {
  attemptId: number;
  userId: number;
  userEmail: string;
  userName: string;
  status: AdminAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
};
