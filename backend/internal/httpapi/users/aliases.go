package users

import "github.com/ismarM/quizio/internal/httpapi/shared"

type (
	CreateUserRequest        = shared.CreateUserRequest
	UpdateDisplayNameRequest = shared.UpdateDisplayNameRequest
	UpdateRoleRequest        = shared.UpdateRoleRequest
	UpdatePreferencesRequest = shared.UpdatePreferencesRequest
	QuestionInput            = shared.QuestionInput
	AnswerInput              = shared.AnswerInput
	CreateQuizRequest        = shared.CreateQuizRequest
	UpdateQuizRequest        = shared.UpdateQuizRequest
	PublishQuizRequest       = shared.PublishQuizRequest
	ArchiveQuizRequest       = shared.ArchiveQuizRequest
	CreateQuestionRequest    = shared.CreateQuestionRequest
	UpdateQuestionRequest    = shared.UpdateQuestionRequest
	AttemptAnswerInput       = shared.AttemptAnswerInput
	UpdateAttemptRequest     = shared.UpdateAttemptRequest
	ImageUploadRequest       = shared.ImageUploadRequest
	ErrorResponse            = shared.ErrorResponse
	UserDTO                  = shared.UserDTO
	UserResponse             = shared.UserResponse
	QuizDTO                  = shared.QuizDTO
	QuizResponse             = shared.QuizResponse
	QuizListResponse         = shared.QuizListResponse
	AnswerDTO                = shared.AnswerDTO
	QuestionDTO              = shared.QuestionDTO
	QuizFullResponse         = shared.QuizFullResponse
	AttemptDTO               = shared.AttemptDTO
	OpenAttemptDTO           = shared.OpenAttemptDTO
	AttemptQuestionDTO       = shared.AttemptQuestionDTO
	AttemptStatusResponse    = shared.AttemptStatusResponse
	AttemptResultResponse    = shared.AttemptResultResponse
	OpenSessionsResponse     = shared.OpenSessionsResponse
	AttemptSessionDTO        = shared.AttemptSessionDTO
	SubmissionsResponse      = shared.SubmissionsResponse
	SubmissionSummary        = shared.SubmissionSummary
	ImageResponse            = shared.ImageResponse
	CategoryDTO              = shared.CategoryDTO
	CategoryListResponse     = shared.CategoryListResponse
	LeaderboardEntryDTO      = shared.LeaderboardEntryDTO
	LeaderboardResponse      = shared.LeaderboardResponse
	QuizAttemptsResponse     = shared.QuizAttemptsResponse
	QuizAttemptDTO           = shared.QuizAttemptDTO
	UserClaims               = shared.UserClaims
)

const defaultLimit = shared.DefaultLimit

var (
	writeJSON               = shared.WriteJSON
	writeError              = shared.WriteError
	decodeJSON              = shared.DecodeJSON
	parseIDParam            = shared.ParseIDParam
	nullStringPtr           = shared.NullStringPtr
	nullTimePtr             = shared.NullTimePtr
	nullTimeStringToSeconds = shared.NullTimeStringToSeconds
	nullTimeToSeconds       = shared.NullTimeToSeconds
	nullInt32Ptr            = shared.NullInt32Ptr
	normalizeLimit          = shared.NormalizeLimit
	parseQueryInt32         = shared.ParseQueryInt32
	parseQueryBool          = shared.ParseQueryBool
	isUniqueViolation       = shared.IsUniqueViolation
	toNullInt32             = shared.ToNullInt32
	toNullString            = shared.ToNullString
	int32Ptr                = shared.Int32Ptr
	UserFromContext         = shared.UserFromContext
	quizFromQuizRow         = shared.QuizFromQuizRow
	quizFromUpdateRow       = shared.QuizFromUpdateRow
	quizFromPublishRow      = shared.QuizFromPublishRow
	quizFromArchiveRow      = shared.QuizFromArchiveRow
	quizFromListRow         = shared.QuizFromListRow
	scoreAttempt            = shared.ScoreAttempt
)
