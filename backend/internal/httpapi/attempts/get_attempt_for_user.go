package attempts

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// GetAttemptForUser godoc
// @Summary Get user attempt details (admin only)
// @Description Get all questions, answers, and user responses for a specific user's attempt on a quiz (admin only).
// @Tags attempts
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param userId path int true "User ID"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/attempt/{userId} [get]
func (h *Handler) GetAttemptForUser(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	userID, err := parseIDParam(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_user_id", "user id is required")
		return
	}

	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can view user attempts")
		return
	}

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

	attempt := attemptFromRow(row)
	if !row.TimeTaken.Valid && !row.IsActive {
		finalized, err := h.queries.FinalizeAttemptIfExpired(r.Context(), row.IDAttempt)
		if err == nil {
			attempt = attemptDTOFromAttempt(finalized)
		}
	}

	result, err := h.buildAttemptResult(r.Context(), attempt, quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}

	writeJSON(w, http.StatusOK, result)
}
