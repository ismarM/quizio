package quizzes

import (
	"context"
	"database/sql"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// Handler owns quiz HTTP routes and leaderboard streaming.
type Handler struct {
	db      *sql.DB
	queries *sqlc.Queries
	hub     *LeaderboardHub
}

// New creates a quiz route handler.
func New(deps shared.Deps) *Handler {
	h := &Handler{
		db:      deps.DB,
		queries: deps.Queries,
	}
	h.hub = NewLeaderboardHub(deps.DB, h.calculateLeaderboard)
	return h
}

// StartLeaderboard starts the leaderboard notification listener.
func (h *Handler) StartLeaderboard(ctx context.Context) {
	h.hub.Start(ctx)
}
