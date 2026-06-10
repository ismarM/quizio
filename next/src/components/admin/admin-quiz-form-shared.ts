export type AdminQuizAnswerDraft = {
  id: string;
  originalId?: number;
  text: string;
  isCorrect: boolean;
};

export type AdminQuizQuestionDraft = {
  id: string;
  originalId?: number;
  title: string;
  points: string;
  answers: AdminQuizAnswerDraft[];
};

export type QuizMetadataPayload = {
  title: string;
  description?: string;
  category_id?: number;
  image_url?: string;
  time_limit_seconds: number;
};

export type QuizQuestionPayload = {
  title: string;
  value: number;
  answers: Array<{
    title: string;
    is_correct: boolean;
  }>;
};

export type CreateQuizPayload = QuizMetadataPayload & {
  questions: QuizQuestionPayload[];
};

export type ValidationLabels = {
  addAtLeastOneQuestion: string;
  questionHasEmptyAnswers: (number: number) => string;
  questionNeedsAnswers: (number: number) => string;
  questionNeedsCorrect: (number: number) => string;
  questionNeedsPoints: (number: number) => string;
  questionNeedsTitle: (number: number) => string;
  timeLimitInvalid: string;
  titleRequired: string;
};

type QuizMetadataFields = {
  title: string;
  description: string;
  categoryId: string;
  thumbnailUrl: string;
  timeLimit: string;
};

export function buildQuizMetadataPayload({
  title,
  description,
  categoryId,
  thumbnailUrl,
  timeLimit,
}: QuizMetadataFields): QuizMetadataPayload | null {
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

export function buildQuestionPayload(
  question: AdminQuizQuestionDraft
): QuizQuestionPayload {
  return {
    title: question.title.trim(),
    value: Number(question.points),
    answers: question.answers.map((answer) => ({
      title: answer.text.trim(),
      is_correct: answer.isCorrect,
    })),
  };
}

export function createAnswer(isCorrect: boolean): AdminQuizAnswerDraft {
  return {
    id: createId(),
    text: "",
    isCorrect,
  };
}

export function createQuestion(): AdminQuizQuestionDraft {
  return {
    id: createId(),
    title: "",
    points: "5",
    answers: [createAnswer(true), createAnswer(false)],
  };
}

export function createValidationLabels(
  t: (key: string, values?: Record<string, number>) => string
): ValidationLabels {
  return {
    addAtLeastOneQuestion: t("addAtLeastOneQuestion"),
    questionHasEmptyAnswers: (number) =>
      t("questionHasEmptyAnswers", { number }),
    questionNeedsAnswers: (number) => t("questionNeedsAnswers", { number }),
    questionNeedsCorrect: (number) => t("questionNeedsCorrect", { number }),
    questionNeedsPoints: (number) => t("questionNeedsPoints", { number }),
    questionNeedsTitle: (number) => t("questionNeedsTitle", { number }),
    timeLimitInvalid: t("timeLimitInvalid"),
    titleRequired: t("titleRequired"),
  };
}

export function getValidationErrors({
  labels,
  title,
  timeLimit,
  questions,
}: {
  labels: ValidationLabels;
  title: string;
  timeLimit: string;
  questions: AdminQuizQuestionDraft[];
}) {
  const errors: string[] = [];
  if (!title.trim()) {
    errors.push(labels.titleRequired);
  }
  if (Number(timeLimit) <= 0) {
    errors.push(labels.timeLimitInvalid);
  }
  if (questions.length === 0) {
    errors.push(labels.addAtLeastOneQuestion);
  }

  questions.forEach((question, index) => {
    const number = index + 1;
    if (!question.title.trim()) {
      errors.push(labels.questionNeedsTitle(number));
    }
    if (Number(question.points) <= 0) {
      errors.push(labels.questionNeedsPoints(number));
    }
    if (question.answers.length < 2) {
      errors.push(labels.questionNeedsAnswers(number));
    }
    if (!question.answers.some((answer) => answer.isCorrect)) {
      errors.push(labels.questionNeedsCorrect(number));
    }
    if (question.answers.some((answer) => !answer.text.trim())) {
      errors.push(labels.questionHasEmptyAnswers(number));
    }
  });

  return errors;
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
