package quizzes

import (
	"database/sql"
	"errors"
	"net/http"
)

// GetQuizLeaderboard godoc
// @Summary Get leaderboard for a quiz
// @Description Get the top performances of users for a quiz (admin only).
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} LeaderboardResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/leaderboard [get]
func (h *Handler) GetQuizLeaderboard(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can view the leaderboard")
		return
	}

	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	resp, err := h.calculateLeaderboard(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_leaderboard_failed", "failed to calculate leaderboard")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}
