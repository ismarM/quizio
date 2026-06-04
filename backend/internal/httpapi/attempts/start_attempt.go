package attempts

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
	"time"
)

// StartAttempt godoc
// @Summary Start attempt
// @Description Start a quiz attempt (only once per user).
// @Tags attempts
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 201 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/attempts [post]
func (h *Handler) StartAttempt(w http.ResponseWriter, r *http.Request) {
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

	quizRow, err := h.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if quizRow.IsArchived || !quizRow.PublishDate.Valid || quizRow.PublishDate.Time.After(time.Now()) {
		writeError(w, http.StatusConflict, "quiz_unavailable", "quiz is not available")
		return
	}

	attempt, err := h.queries.CreateAttempt(r.Context(), sqlc.CreateAttemptParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "attempt_exists", "attempt already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "create_attempt_failed", "failed to create attempt")
		return
	}

	attemptDTO := attemptDTOFromAttempt(attempt)
	result, err := h.buildAttemptResult(r.Context(), attemptDTO, quizID, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}

	writeJSON(w, http.StatusCreated, result)
}
