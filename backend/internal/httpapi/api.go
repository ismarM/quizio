package httpapi

import (
	"database/sql"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

type API struct {
	db      *sql.DB
	queries *sqlc.Queries
}

func NewAPI(db *sql.DB) *API {
	return &API{
		db:      db,
		queries: sqlc.New(db),
	}
}
