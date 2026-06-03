import type { QuestionDTO, QuizDTO } from "@/lib/types";

type AdminQuizStatus = "draft" | "scheduled" | "published" | "archived";

export type AdminQuizListItem = {
  id: number;
  title: string;
  description: string;
  status: AdminQuizStatus;
  categoryId?: number;
  category: string;
  imageUrl: string;
  questionCount: number;
  timeLimitMinutes: number;
  attempts: number;
  createdAt: string;
  publishAt?: string;
  publishAtLabel: string;
};

export type AdminQuizAnswer = {
  id: number;
  title: string;
  isCorrect: boolean;
};

export type AdminQuizQuestion = {
  id: number;
  title: string;
  points: number;
  answers: AdminQuizAnswer[];
};

export type AdminQuizDetail = AdminQuizListItem & {
  questions: AdminQuizQuestion[];
};

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatAdminDate(value?: string) {
  const date = parseDate(value);
  if (!date) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatAdminDateTime(value?: string) {
  const date = parseDate(value);
  if (!date) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapStatus(quiz: QuizDTO): AdminQuizStatus {
  if (quiz.is_archived) {
    return "archived";
  }

  const publishDate = parseDate(quiz.publish_date);
  if (!publishDate) {
    return "draft";
  }

  if (publishDate.getTime() > Date.now()) {
    return "scheduled";
  }

  return "published";
}

function mapTimeLimitMinutes(quiz: QuizDTO) {
  const timeLimitSeconds = quiz.time_limit_seconds ?? 0;
  if (timeLimitSeconds <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(timeLimitSeconds / 60));
}

export function mapQuizDtoToAdminListItem(quiz: QuizDTO): AdminQuizListItem {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? "No description available.",
    status: mapStatus(quiz),
    categoryId: quiz.category_id,
    category: quiz.category_name ?? "Uncategorized",
    imageUrl: quiz.image_url ?? "",
    questionCount: quiz.question_count ?? 0,
    timeLimitMinutes: mapTimeLimitMinutes(quiz),
    attempts: 0,
    createdAt: formatAdminDate(quiz.created_at),
    publishAt: quiz.publish_date,
    publishAtLabel: formatAdminDateTime(quiz.publish_date),
  };
}

export function mapFullQuizToAdminDetail(
  quiz: QuizDTO,
  questions: QuestionDTO[]
): AdminQuizDetail {
  return {
    ...mapQuizDtoToAdminListItem({
      ...quiz,
      question_count: questions.length,
    }),
    description: quiz.description ?? "",
    questions: questions.map((question) => ({
      id: question.id,
      title: question.title,
      points: question.value,
      answers: question.answers.map((answer) => ({
        id: answer.id,
        title: answer.title,
        isCorrect: Boolean(answer.is_correct),
      })),
    })),
  };
}
