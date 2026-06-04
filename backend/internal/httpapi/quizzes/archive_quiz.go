package quizzes

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// ArchiveQuiz godoc
// @Summary Archive quiz
// @Description Archive or unarchive a quiz.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body ArchiveQuizRequest true "Archive quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/archive [patch]
func (h *Handler) ArchiveQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can archive quizzes")
		return
	}

	var req ArchiveQuizRequest
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
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can archive it")
		return
	}

	updated, err := h.queries.ArchiveQuiz(r.Context(), sqlc.ArchiveQuizParams{
		IDQuiz:     quizID,
		IsArchived: req.IsArchived,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "archive_quiz_failed", "failed to archive quiz")
		return
	}

	quizDTO := quizFromArchiveRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}
