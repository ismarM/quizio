package questions

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// UpdateQuestion godoc
// @Summary Update question
// @Description Update a question and optionally its answers (quiz not published).
// @Tags questions
// @Accept json
// @Produce json
// @Param questionId path int true "Question ID"
// @Param request body UpdateQuestionRequest true "Update question"
// @Success 200 {object} QuestionDTO
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/questions/{questionId} [put]
func (h *Handler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	questionID, err := parseIDParam(r, "questionId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_question_id", "question id is required")
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

	var req UpdateQuestionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	quizID, err := h.queries.GetQuestionQuizID(r.Context(), questionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "question not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_question_failed", "failed to load question")
		return
	}

	state, err := h.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
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
	questionRow, err := qtx.UpdateQuestion(ctx, sqlc.UpdateQuestionParams{
		IDQuestion: questionID,
		Title:      req.Title,
		Value:      req.Value,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update_question_failed", "failed to update question")
		return
	}

	answers := make([]AnswerDTO, 0)
	if len(req.Answers) > 0 {
		if err := qtx.DeleteAnswersByQuestion(ctx, questionID); err != nil {
			writeError(w, http.StatusInternalServerError, "delete_answers_failed", "failed to update answers")
			return
		}
		for _, answer := range req.Answers {
			if answer.Title == "" {
				writeError(w, http.StatusBadRequest, "invalid_payload", "answer title is required")
				return
			}
			answerRow, err := qtx.CreateAnswer(ctx, sqlc.CreateAnswerParams{
				Title:      answer.Title,
				TkQuestion: questionID,
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
	} else {
		answerRows, err := qtx.ListAnswersByQuestion(ctx, questionID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "load_answers_failed", "failed to load answers")
			return
		}
		answers = make([]AnswerDTO, 0, len(answerRows))
		for _, answer := range answerRows {
			answers = append(answers, AnswerDTO{
				ID:        answer.IDAnswer,
				Title:     answer.Title,
				IsCorrect: answer.IsCorrect,
			})
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit question")
		return
	}

	writeJSON(w, http.StatusOK, QuestionDTO{
		ID:      questionRow.IDQuestion,
		Title:   questionRow.Title,
		Value:   questionRow.Value,
		QuizID:  questionRow.TkQuiz,
		Answers: answers,
	})
}
