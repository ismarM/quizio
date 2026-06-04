package attempts

import (
	"context"
	"github.com/ismarM/quizio/internal/db/sqlc"
)

func (h *Handler) buildAttemptResult(ctx context.Context, attempt AttemptDTO, quizID int32, includeCorrect bool) (AttemptResultResponse, error) {
	quizRow, err := h.queries.GetQuizByID(ctx, quizID)
	if err != nil {
		return AttemptResultResponse{}, err
	}
	questions, err := h.loadQuizQuestions(ctx, quizID, includeCorrect)
	if err != nil {
		return AttemptResultResponse{}, err
	}
	responses, err := h.queries.ListAttemptQuestions(ctx, attempt.ID)
	if err != nil {
		return AttemptResultResponse{}, err
	}

	quizDTO := quizFromQuizRow(quizRow, int32(len(questions)))
	return AttemptResultResponse{
		Attempt:   attempt,
		Quiz:      quizDTO,
		Questions: questions,
		Responses: mapAttemptResponses(responses),
	}, nil
}
func attemptDTOFromAttempt(attempt sqlc.QuizioAttempt) AttemptDTO {
	return AttemptDTO{
		ID:               attempt.IDAttempt,
		StartTime:        attempt.StartTime,
		TimeTakenSeconds: nullTimeStringToSeconds(attempt.TimeTaken),
		QuizID:           attempt.TkQuiz,
		UserID:           attempt.TkUser,
	}
}
func attemptFromRow(row sqlc.GetAttemptWithQuizRow) AttemptDTO {
	return AttemptDTO{
		ID:               row.IDAttempt,
		StartTime:        row.StartTime,
		TimeTakenSeconds: nullTimeStringToSeconds(row.TimeTaken),
		QuizID:           row.TkQuiz,
		UserID:           row.TkUser,
	}
}
func mapAttemptResponses(rows []sqlc.QuizioAttemptQuestion) []AttemptQuestionDTO {
	responses := make([]AttemptQuestionDTO, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, AttemptQuestionDTO{
			QuestionID: row.TkQuestion,
			AnswerID:   row.TkAnswer,
		})
	}
	return responses
}
