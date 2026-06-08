package quizzes

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// PublishQuiz godoc
// @Summary Publish quiz
// @Description Publish a quiz immediately or schedule a publish date.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body PublishQuizRequest true "Publish quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/publish [patch]
func (h *Handler) PublishQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can publish quizzes")
		return
	}

	var req PublishQuizRequest
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
	if state.IsArchived {
		writeError(w, http.StatusConflict, "quiz_locked", "archived quiz is locked")
		return
	}

	if req.Unpublish {
		updated, err := h.queries.SetQuizPublishDate(r.Context(), sqlc.SetQuizPublishDateParams{
			IDQuiz:      quizID,
			PublishDate: sql.NullTime{Valid: false},
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "unpublish_quiz_failed", "failed to unpublish quiz")
			return
		}

		quizDTO := quizFromPublishRow(updated)
		writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
		return
	}

	if IsQuizPublishLocked(state, time.Now()) {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	publishTime := time.Now()
	if req.PublishDate != nil {
		publishTime = *req.PublishDate
	}

	updated, err := h.queries.SetQuizPublishDate(r.Context(), sqlc.SetQuizPublishDateParams{
		IDQuiz:      quizID,
		PublishDate: sql.NullTime{Time: publishTime, Valid: true},
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "publish_quiz_failed", "failed to publish quiz")
		return
	}

	quizDTO := quizFromPublishRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// IsQuizPublishLocked reports whether the quiz cannot be scheduled or published.
func IsQuizPublishLocked(state sqlc.GetQuizStateRow, now time.Time) bool {
	if state.IsArchived {
		return true
	}

	return state.PublishDate.Valid && !state.PublishDate.Time.After(now)
}
