package quizzes

import (
	"database/sql"
	"errors"
	"net/http"
)

// GetFullQuiz godoc
// @Summary Get full quiz
// @Description Get the full quiz definition (only for admin/owner).
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizFullResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [get]
func (h *Handler) GetFullQuiz(w http.ResponseWriter, r *http.Request) {
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

	quizRow, err := h.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if !claims.IsAdmin || quizRow.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can view the full quiz details")
		return
	}

	questions, err := h.loadQuizQuestions(r.Context(), quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load_questions_failed", "failed to load quiz questions")
		return
	}

	quizDTO := quizFromQuizRow(quizRow, int32(len(questions)))
	writeJSON(w, http.StatusOK, QuizFullResponse{Quiz: quizDTO, Questions: questions})
}
