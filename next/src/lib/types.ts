export type QuizDTO = {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
  publish_date?: string;
  owner_id?: number;
  is_archived?: boolean;
  time_limit_seconds?: number;
  question_count?: number;
  attempt_count?: number;
  category_id?: number;
  category_name?: string;
  image_url?: string;
};

export type QuizListResponse = {
  quizzes: QuizDTO[];
  limit: number;
  offset: number;
};

export type QuizResponse = {
  quiz: QuizDTO;
};

export type QuizFullResponse = {
  quiz: QuizDTO;
  questions: QuestionDTO[];
};

export type CategoryDTO = {
  id: number;
  name: string;
};

export type CategoryListResponse = {
  categories: CategoryDTO[];
};

export type OpenAttemptDTO = {
  id: number;
  start_time: string;
  quiz_id: number;
  user_id: number;
};

export type AttemptSessionDTO = {
  attempt: OpenAttemptDTO;
  time_limit_seconds: number;
};

export type OpenSessionsResponse = {
  attempts: AttemptSessionDTO[];
};

export type QuizListItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  questionCount: number;
  timeLimitMinutes: number;
  plays: string;
  status: "published" | "draft";
  opensAt: string;
  image: string;
};

export type AnswerDTO = {
  id: number;
  title: string;
  is_correct?: boolean;
};

export type QuestionDTO = {
  id: number;
  quiz_id: number;
  title: string;
  value: number;
  answers: AnswerDTO[];
};

export type AttemptDTO = {
  id: number;
  quiz_id: number;
  user_id: number;
  start_time: string;
  time_taken_seconds?: number;
};

export type AttemptQuestionDTO = {
  question_id: number;
  answer_id: number;
};

export type AttemptResultResponse = {
  attempt: AttemptDTO;
  quiz: QuizDTO;
  questions: QuestionDTO[];
  responses: AttemptQuestionDTO[];
};

export type UpdateAttemptRequest = {
  updates: AttemptQuestionDTO[];
};

export type SubmissionSummary = {
  quiz_id: number;
  quiz_title: string;
  start_time: string;
  time_taken_seconds?: number;
  max_points: number;
  achieved_points: number;
};

export type SubmissionsResponse = {
  results: SubmissionSummary[];
  limit: number;
  offset: number;
};

export type LeaderboardEntryDTO = {
  user_id: number;
  email: string;
  display_name?: string;
  achieved_points: number;
  max_points: number;
  time_taken_seconds?: number;
};

export type LeaderboardResponse = {
  quiz_id: number;
  entries: LeaderboardEntryDTO[];
};

export type QuizAttemptDTO = {
  id_attempt: number;
  user_id: number;
  user_email: string;
  start_time: string;
  time_taken_seconds?: number;
  score_achieved: number;
};

export type QuizAttemptsResponse = {
  attempts: QuizAttemptDTO[];
};
