import type { QuestionDTO, QuizDTO } from "@/lib/types";

type AdminQuizStatus = "draft" | "published" | "archived";

export type AdminQuizListItem = {
  id: number;
  title: string;
  description: string;
  status: AdminQuizStatus;
  category: string;
  questionCount: number;
  timeLimitMinutes: number;
  attempts: number;
  createdAt: string;
};

export type AdminQuizQuestion = {
  id: number;
  title: string;
  points: number;
  answers: number;
};

export type AdminQuizDetail = AdminQuizListItem & {
  questions: AdminQuizQuestion[];
};

function formatAdminDate(value?: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function mapStatus(quiz: QuizDTO): AdminQuizStatus {
  if (quiz.is_archived) {
    return "archived";
  }
  if (quiz.publish_date) {
    return "published";
  }
  return "draft";
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
    category: quiz.category_name ?? "Uncategorized",
    questionCount: quiz.question_count ?? 0,
    timeLimitMinutes: mapTimeLimitMinutes(quiz),
    attempts: 0,
    createdAt: formatAdminDate(quiz.created_at),
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
      answers: question.answers.length,
    })),
  };
}
