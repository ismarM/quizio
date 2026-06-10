package shared

import "time"

type CreateUserRequest struct {
	Email          string  `json:"email"`
	DisplayName    *string `json:"display_name,omitempty"`
	Language       int32   `json:"language"`
	Theme          int32   `json:"theme"`
	ProfilePicture *string `json:"profile_picture,omitempty"`
}

type UpdateDisplayNameRequest struct {
	DisplayName string `json:"display_name"`
}

type UpdateRoleRequest struct {
	IsAdmin bool `json:"is_admin"`
}

type UpdatePreferencesRequest struct {
	Language int32 `json:"language"`
	Theme    int32 `json:"theme"`
}

type QuestionInput struct {
	Title   string        `json:"title"`
	Value   float64       `json:"value"`
	Answers []AnswerInput `json:"answers"`
}

type AnswerInput struct {
	Title     string `json:"title"`
	IsCorrect bool   `json:"is_correct"`
}

type CreateQuizRequest struct {
	OwnerID          int32           `json:"owner_id"`
	Title            string          `json:"title"`
	Description      *string         `json:"description,omitempty"`
	TimeLimitSeconds int32           `json:"time_limit_seconds"`
	Questions        []QuestionInput `json:"questions"`
	CategoryID       *int32          `json:"category_id,omitempty"`
	ImageURL         *string         `json:"image_url,omitempty"`
}

type UpdateQuizRequest struct {
	Title            string  `json:"title"`
	Description      *string `json:"description,omitempty"`
	TimeLimitSeconds int32   `json:"time_limit_seconds"`
	CategoryID       *int32  `json:"category_id,omitempty"`
	ImageURL         *string `json:"image_url,omitempty"`
}

type PublishQuizRequest struct {
	PublishDate *time.Time `json:"publish_date,omitempty"`
	Unpublish   bool       `json:"unpublish,omitempty"`
}

type ArchiveQuizRequest struct {
	IsArchived bool `json:"is_archived"`
}

type CreateQuestionRequest struct {
	Title   string        `json:"title"`
	Value   float64       `json:"value"`
	Answers []AnswerInput `json:"answers"`
}

type UpdateQuestionRequest struct {
	Title   string        `json:"title"`
	Value   float64       `json:"value"`
	Answers []AnswerInput `json:"answers"`
}

type AttemptAnswerInput struct {
	QuestionID int32 `json:"question_id"`
	AnswerID   int32 `json:"answer_id"`
}

type UpdateAttemptRequest struct {
	Updates []AttemptAnswerInput `json:"updates"`
}

type ImageUploadRequest struct {
	Filename string `json:"filename"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

type UserDTO struct {
	ID             int32   `json:"id"`
	Email          string  `json:"email"`
	IsAdmin        bool    `json:"is_admin"`
	DisplayName    *string `json:"display_name,omitempty"`
	Language       int32   `json:"language"`
	Theme          int32   `json:"theme"`
	ProfilePicture *string `json:"profile_picture,omitempty"`
}

type UserResponse struct {
	User UserDTO `json:"user"`
}

type QuizDTO struct {
	ID               int32      `json:"id"`
	Title            string     `json:"title"`
	Description      *string    `json:"description,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	PublishDate      *time.Time `json:"publish_date,omitempty"`
	OwnerID          int32      `json:"owner_id"`
	IsArchived       bool       `json:"is_archived"`
	TimeLimitSeconds int32      `json:"time_limit_seconds"`
	QuestionCount    *int32     `json:"question_count,omitempty"`
	CategoryID       *int32     `json:"category_id,omitempty"`
	ImageURL         *string    `json:"image_url,omitempty"`
	CategoryName     *string    `json:"category_name,omitempty"`
	IsCompleted      bool       `json:"is_completed"`
}

type QuizResponse struct {
	Quiz QuizDTO `json:"quiz"`
}

type QuizListResponse struct {
	Quizzes []QuizDTO `json:"quizzes"`
	Limit   int32     `json:"limit"`
	Offset  int32     `json:"offset"`
}

type AnswerDTO struct {
	ID        int32  `json:"id"`
	Title     string `json:"title"`
	IsCorrect bool   `json:"is_correct"`
}

type QuestionDTO struct {
	ID      int32       `json:"id"`
	Title   string      `json:"title"`
	Value   float64     `json:"value"`
	QuizID  int32       `json:"quiz_id"`
	Answers []AnswerDTO `json:"answers"`
}

type QuizFullResponse struct {
	Quiz      QuizDTO       `json:"quiz"`
	Questions []QuestionDTO `json:"questions"`
}

type AttemptDTO struct {
	ID               int32     `json:"id"`
	StartTime        time.Time `json:"start_time"`
	TimeTakenSeconds *int32    `json:"time_taken_seconds,omitempty"`
	QuizID           int32     `json:"quiz_id"`
	UserID           int32     `json:"user_id"`
	UserName         string    `json:"user_name,omitempty"`
}

type OpenAttemptDTO struct {
	ID        int32     `json:"id"`
	StartTime time.Time `json:"start_time"`
	QuizID    int32     `json:"quiz_id"`
	UserID    int32     `json:"user_id"`
}

type AttemptQuestionDTO struct {
	QuestionID int32 `json:"question_id"`
	AnswerID   int32 `json:"answer_id"`
}

type AttemptStatusResponse struct {
	Attempt   AttemptDTO           `json:"attempt"`
	Responses []AttemptQuestionDTO `json:"responses"`
}

type AttemptResultResponse struct {
	Attempt   AttemptDTO           `json:"attempt"`
	Quiz      QuizDTO              `json:"quiz"`
	Questions []QuestionDTO        `json:"questions"`
	Responses []AttemptQuestionDTO `json:"responses"`
}

type OpenSessionsResponse struct {
	Attempts []AttemptSessionDTO `json:"attempts"`
}

type AttemptSessionDTO struct {
	Attempt          OpenAttemptDTO `json:"attempt"`
	TimeLimitSeconds int32          `json:"time_limit_seconds"`
}

type SubmissionsResponse struct {
	Results []SubmissionSummary `json:"results"`
	Limit   int32               `json:"limit"`
	Offset  int32               `json:"offset"`
}

type SubmissionSummary struct {
	QuizID           int32     `json:"quiz_id"`
	QuizTitle        string    `json:"quiz_title"`
	StartTime        time.Time `json:"start_time"`
	TimeTakenSeconds *int32    `json:"time_taken_seconds,omitempty"`
	MaxPoints        float64   `json:"max_points"`
	AchievedPoints   float64   `json:"achieved_points"`
}

type ImageResponse struct {
	URL string `json:"url"`
}

type CategoryDTO struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type CategoryListResponse struct {
	Categories []CategoryDTO `json:"categories"`
}

type LeaderboardEntryDTO struct {
	UserID           int32   `json:"user_id"`
	Email            string  `json:"email"`
	DisplayName      *string `json:"display_name,omitempty"`
	AchievedPoints   float64 `json:"achieved_points"`
	MaxPoints        float64 `json:"max_points"`
	TimeTakenSeconds *int32  `json:"time_taken_seconds,omitempty"`
}

type LeaderboardResponse struct {
	QuizID  int32                 `json:"quiz_id"`
	Entries []LeaderboardEntryDTO `json:"entries"`
}

type QuizAttemptsResponse struct {
	Attempts []QuizAttemptDTO `json:"attempts"`
}

type QuizAttemptDTO struct {
	IDAttempt        int32     `json:"id_attempt"`
	UserID           int32     `json:"user_id"`
	UserName         string    `json:"user_name"`
	StartTime        time.Time `json:"start_time"`
	TimeTakenSeconds *int32    `json:"time_taken_seconds,omitempty"`
	ScoreAchieved    float64   `json:"score_achieved"`
}
