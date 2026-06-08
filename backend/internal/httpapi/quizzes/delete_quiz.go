package quizzes

import (
	"net/http"
)

// DeleteQuiz godoc
// @Summary Delete quiz
// @Description Delete a quiz and all related data.
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [delete]
func (h *Handler) DeleteQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can delete quizzes")
		return
	}

	if err := h.queries.DeleteQuiz(r.Context(), quizID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_quiz_failed", "failed to delete quiz")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}
