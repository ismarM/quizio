package quizzes

import (
	"database/sql"
	"errors"
	"net/http"
	"time"
)

// GetQuizInfo godoc
// @Summary Get quiz info
// @Description Get quiz info for published quizzes.
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/info [get]
func (h *Handler) GetQuizInfo(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	row, err := h.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if row.IsArchived || !row.PublishDate.Valid || row.PublishDate.Time.After(time.Now()) {
		writeError(w, http.StatusNotFound, "not_found", "quiz not found")
		return
	}

	quizDTO := quizFromQuizRow(row, row.QuestionCount)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}
