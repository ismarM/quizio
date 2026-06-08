package questions

import (
	"database/sql"
	"errors"
	"net/http"
)

// DeleteQuestion godoc
// @Summary Delete question
// @Description Delete a question (quiz not published).
// @Tags questions
// @Produce json
// @Param questionId path int true "Question ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/questions/{questionId} [delete]
func (h *Handler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
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
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	if err := h.queries.DeleteQuestion(r.Context(), questionID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_question_failed", "failed to delete question")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}
