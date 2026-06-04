package users

import "net/http"

// GetOpenSessions godoc
// @Summary Get open sessions
// @Description Return attempts that are in progress and not expired for the authenticated user.
// @Tags users
// @Produce json
// @Success 200 {object} OpenSessionsResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/open-sessions [get]
func (h *Handler) GetOpenSessions(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	if err := h.queries.FinalizeExpiredAttemptsForUser(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "finalize_attempts_failed", "failed to finalize expired attempts")
		return
	}

	rows, err := h.queries.ListOpenAttemptsByUser(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_open_sessions_failed", "failed to list open sessions")
		return
	}

	response := OpenSessionsResponse{Attempts: make([]AttemptSessionDTO, 0, len(rows))}
	for _, row := range rows {
		attempt := OpenAttemptDTO{
			ID:        row.IDAttempt,
			StartTime: row.StartTime,
			QuizID:    row.TkQuiz,
			UserID:    row.TkUser,
		}
		response.Attempts = append(response.Attempts, AttemptSessionDTO{
			Attempt:          attempt,
			TimeLimitSeconds: row.TimeLimitSeconds,
		})
	}

	writeJSON(w, http.StatusOK, response)
}
