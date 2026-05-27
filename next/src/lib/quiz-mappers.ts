import type { QuizDTO, QuizListItem } from "@/lib/types";

function formatQuizDate(value?: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function mapQuizDtoToListItem(quiz: QuizDTO): QuizListItem {
  const timeLimitSeconds = quiz.time_limit_seconds ?? 0;
  const timeLimitMinutes =
    timeLimitSeconds > 0 ? Math.max(1, Math.round(timeLimitSeconds / 60)) : 0;

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? "No description available yet.",
    category: quiz.category_name ?? "General",
    questionCount: quiz.question_count ?? 0,
    timeLimitMinutes,
    plays: "0",
    status: quiz.is_archived ? "draft" : "published",
    opensAt: formatQuizDate(quiz.publish_date ?? quiz.created_at),
    image: quiz.image_url ?? "",
  };
}
