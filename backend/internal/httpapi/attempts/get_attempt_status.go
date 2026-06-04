package attempts

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// GetAttemptStatus godoc
// @Summary Get attempt status
// @Description Get attempt status for session restoration; finalize if expired.
// @Tags attempts
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/attempts [get]
func (h *Handler) GetAttemptStatus(w http.ResponseWriter, r *http.Request) {
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
	userID := claims.ID

	row, err := h.queries.GetAttemptWithQuiz(r.Context(), sqlc.GetAttemptWithQuizParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "attempt not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_attempt_failed", "failed to load attempt")
		return
	}

	if row.TimeTaken.Valid {
		result, err := h.buildAttemptResult(r.Context(), attemptFromRow(row), quizID, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	if !row.IsActive {
		finalized, err := h.queries.FinalizeAttemptIfExpired(r.Context(), row.IDAttempt)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusInternalServerError, "finalize_attempt_failed", "failed to finalize attempt")
			return
		}
		attempt := attemptFromRow(row)
		if err == nil {
			attempt = attemptDTOFromAttempt(finalized)
		}
		result, err := h.buildAttemptResult(r.Context(), attempt, quizID, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	attempt := attemptFromRow(row)
	result, err := h.buildAttemptResult(r.Context(), attempt, quizID, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}
	writeJSON(w, http.StatusOK, result)
}
