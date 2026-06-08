package quizzes

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// UpdateQuiz godoc
// @Summary Update quiz
// @Description Update quiz metadata (only when not published).
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body UpdateQuizRequest true "Update quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [put]
func (h *Handler) UpdateQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can update quizzes")
		return
	}

	var req UpdateQuizRequest
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

	state, err := h.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	updated, err := h.queries.UpdateQuiz(r.Context(), sqlc.UpdateQuizParams{
		IDQuiz:      quizID,
		Title:       req.Title,
		Description: toNullString(req.Description),
		Secs:        float64(req.TimeLimitSeconds),
		TkCategory:  toNullInt32(req.CategoryID),
		ImageUrl:    toNullString(req.ImageURL),
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "quiz_exists", "quiz title already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "update_quiz_failed", "failed to update quiz")
		return
	}

	quizDTO := quizFromUpdateRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}
