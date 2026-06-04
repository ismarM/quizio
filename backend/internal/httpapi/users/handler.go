package users

import (
	"database/sql"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// Handler owns user HTTP routes.
type Handler struct {
	db      *sql.DB
	queries *sqlc.Queries
}

// New creates a user route handler.
func New(deps shared.Deps) *Handler {
	return &Handler{
		db:      deps.DB,
		queries: deps.Queries,
	}
}
