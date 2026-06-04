package attempts

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// FinishAttempt godoc
// @Summary Finish attempt
// @Description Finish an attempt and return raw results.
// @Tags attempts
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/attempts/finish [post]
func (h *Handler) FinishAttempt(w http.ResponseWriter, r *http.Request) {
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

	attempts, err := h.queries.ListAttemptsByUser(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "get_attempt_failed", "failed to load attempt")
		return
	}
	var attemptRow *sqlc.QuizioAttempt
	for i := range attempts {
		if attempts[i].TkQuiz == quizID {
			attemptRow = &attempts[i]
			break
		}
	}
	if attemptRow == nil {
		writeError(w, http.StatusNotFound, "not_found", "attempt not found")
		return
	}

	attemptDTO := attemptDTOFromAttempt(*attemptRow)
	if !attemptRow.TimeTaken.Valid {
		finalized, err := h.queries.FinalizeAttempt(r.Context(), attemptRow.IDAttempt)
		if err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusInternalServerError, "finalize_attempt_failed", "failed to finalize attempt")
				return
			}
		} else {
			attemptDTO = attemptDTOFromAttempt(finalized)
		}
	}

	result, err := h.buildAttemptResult(r.Context(), attemptDTO, quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}

	writeJSON(w, http.StatusOK, result)
}
