package quizzes

import (
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// CreateQuiz godoc
// @Summary Create quiz
// @Description Create a quiz with questions and answers.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param request body CreateQuizRequest true "Create quiz request"
// @Success 201 {object} QuizFullResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes [post]
func (h *Handler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can create quizzes")
		return
	}

	var req CreateQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if req.TimeLimitSeconds <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "time_limit_seconds must be positive")
		return
	}
	if len(req.Questions) == 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "questions are required")
		return
	}

	ctx := r.Context()
	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "tx_failed", "failed to start transaction")
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := h.queries.WithTx(tx)
	quizRow, err := qtx.CreateQuiz(ctx, sqlc.CreateQuizParams{
		Title:       req.Title,
		Secs:        float64(req.TimeLimitSeconds),
		Description: toNullString(req.Description),
		TkUser:      claims.ID,
		TkCategory:  toNullInt32(req.CategoryID),
		ImageUrl:    toNullString(req.ImageURL),
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "quiz_exists", "quiz title already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "create_quiz_failed", "failed to create quiz")
		return
	}

	questions := make([]QuestionDTO, 0, len(req.Questions))
	for _, question := range req.Questions {
		if question.Title == "" {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question title is required")
			return
		}
		if len(question.Answers) == 0 {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question answers are required")
			return
		}
		questionRow, err := qtx.CreateQuestion(ctx, sqlc.CreateQuestionParams{
			Title:  question.Title,
			Value:  question.Value,
			TkQuiz: quizRow.IDQuiz,
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "create_question_failed", "failed to create question")
			return
		}

		answers := make([]AnswerDTO, 0, len(question.Answers))
		for _, answer := range question.Answers {
			if answer.Title == "" {
				writeError(w, http.StatusBadRequest, "invalid_payload", "answer title is required")
				return
			}
			answerRow, err := qtx.CreateAnswer(ctx, sqlc.CreateAnswerParams{
				Title:      answer.Title,
				TkQuestion: questionRow.IDQuestion,
				IsCorrect:  answer.IsCorrect,
			})
			if err != nil {
				writeError(w, http.StatusInternalServerError, "create_answer_failed", "failed to create answer")
				return
			}
			answers = append(answers, AnswerDTO{
				ID:        answerRow.IDAnswer,
				Title:     answerRow.Title,
				IsCorrect: answerRow.IsCorrect,
			})
		}

		questions = append(questions, QuestionDTO{
			ID:      questionRow.IDQuestion,
			Title:   questionRow.Title,
			Value:   questionRow.Value,
			QuizID:  questionRow.TkQuiz,
			Answers: answers,
		})
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit quiz")
		return
	}

	quizDTO := QuizDTO{
		ID:               quizRow.IDQuiz,
		Title:            quizRow.Title,
		Description:      nullStringPtr(quizRow.Description),
		CreatedAt:        quizRow.CreatedAt,
		PublishDate:      nullTimePtr(quizRow.PublishDate),
		OwnerID:          quizRow.TkUser,
		IsArchived:       quizRow.IsArchived,
		TimeLimitSeconds: quizRow.TimeLimitSeconds,
		QuestionCount:    int32Ptr(int32(len(questions))),
		CategoryID:       nullInt32Ptr(quizRow.TkCategory),
		ImageURL:         nullStringPtr(quizRow.ImageUrl),
	}

	writeJSON(w, http.StatusCreated, QuizFullResponse{
		Quiz:      quizDTO,
		Questions: questions,
	})
}
