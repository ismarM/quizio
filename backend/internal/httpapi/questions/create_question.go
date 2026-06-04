package questions

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// CreateQuestion godoc
// @Summary Create question
// @Description Create a question for a quiz that is not published.
// @Tags questions
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body CreateQuestionRequest true "Create question"
// @Success 201 {object} QuestionDTO
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/questions [post]
func (h *Handler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can manage questions")
		return
	}

	var req CreateQuestionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	state, err := h.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can manage questions")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if len(req.Answers) == 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "answers are required")
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
	questionRow, err := qtx.CreateQuestion(ctx, sqlc.CreateQuestionParams{
		Title:  req.Title,
		Value:  req.Value,
		TkQuiz: quizID,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "create_question_failed", "failed to create question")
		return
	}

	answers := make([]AnswerDTO, 0, len(req.Answers))
	for _, answer := range req.Answers {
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

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit question")
		return
	}

	writeJSON(w, http.StatusCreated, QuestionDTO{
		ID:      questionRow.IDQuestion,
		Title:   questionRow.Title,
		Value:   questionRow.Value,
		QuizID:  questionRow.TkQuiz,
		Answers: answers,
	})
}
