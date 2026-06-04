package attempts

import (
	"database/sql"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// Handler owns quiz attempt HTTP routes.
type Handler struct {
	db      *sql.DB
	queries *sqlc.Queries
}

// New creates an attempt route handler.
func New(deps shared.Deps) *Handler {
	return &Handler{
		db:      deps.DB,
		queries: deps.Queries,
	}
}
