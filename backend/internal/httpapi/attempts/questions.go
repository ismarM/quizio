package attempts

import (
	"context"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func (h *Handler) loadQuizQuestions(ctx context.Context, quizID int32, includeCorrect bool) ([]QuestionDTO, error) {
	return shared.LoadQuizQuestions(ctx, h.queries, quizID, includeCorrect)
}
