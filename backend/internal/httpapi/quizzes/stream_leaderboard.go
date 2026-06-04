package quizzes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"
)

// StreamLeaderboard godoc
// @Summary Stream leaderboard for a quiz (SSE)
// @Description Stream the real-time leaderboard performance of users for a quiz via Server-Sent Events (SSE).
// @Tags quizzes
// @Produce text/event-stream
// @Param quizId path int true "Quiz ID"
// @Success 200 {string} string "data: {LeaderboardResponse}"
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/leaderboard/stream [get]
func (h *Handler) StreamLeaderboard(w http.ResponseWriter, r *http.Request) {
	_, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	// Verify quiz exists
	_, err = h.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")

	rc := http.NewResponseController(w)
	_ = rc.SetWriteDeadline(time.Time{})

	w.WriteHeader(http.StatusOK)
	_ = rc.Flush()

	// Send initial state
	initial, err := h.calculateLeaderboard(r.Context(), quizID)
	if err != nil {
		log.Printf("failed to fetch initial leaderboard for quiz %d: %v", quizID, err)
	} else {
		initialBytes, _ := json.Marshal(initial)
		_, _ = fmt.Fprintf(w, "data: %s\n\n", initialBytes)
		_ = rc.Flush()
	}

	// Subscribe to hub
	ch := h.hub.Subscribe(quizID)
	defer h.hub.Unsubscribe(quizID, ch)

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			_, _ = fmt.Fprint(w, ": keep-alive\n\n")
			_ = rc.Flush()
		case update, ok := <-ch:
			if !ok {
				return
			}
			updateBytes, err := json.Marshal(update)
			if err != nil {
				continue
			}
			_, _ = fmt.Fprintf(w, "data: %s\n\n", updateBytes)
			_ = rc.Flush()
		}
	}
}
